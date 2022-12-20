import Table from "./Table";
import { Type, JsonType, ArrayType } from "./Type";

/**
 * Arg is a wrapper to mark a particular value as being an argument for the
 * query. When compiled, the value will be placed into the `args` array, and
 * a `$n` reference will be placed in the appropriate place in the SQL string.
 */
class Arg {
  public typehint = "";

  constructor(public value: any, type?: Type) {
    // JSON arrays make node-postgres fall over, but we can work around it
    // with a special-case typehint
    if (Array.isArray(value) && value[0] && typeof value[0] === "object") {
      if (type instanceof JsonType) {
        this.value = JSON.stringify(this.value);
        this.typehint = "::JSONB";
      } else {
        this.typehint = "::JSONB[]";
      }
    }
  }
}

/**
 * The Atom represents one 'part' of a Postgres query. This could be a literal
 * string of SQL, an argument, a sub-query, or a table (which will be compiled
 * to its name).
 */
export type Atom<T extends DbObject> = string | Arg | Query<T> | Table;

const atomIsArg = <T extends DbObject>(atom: Atom<T>): atom is Arg => atom instanceof Arg;

class NonScalarArrayAccessError extends Error {
  constructor(public fieldName: string, public path: string[]) {
    super("Non-scalar array access");
  }
}

const isMagnitudeOp = (op: string) => ["$lt", "$lte", "$gt", "$gte"].indexOf(op) > -1;

const comparisonOps = {
  $eq: "=",
  $ne: "<>",
  $lt: "<",
  $lte: "<=",
  $gt: ">",
  $gte: ">=",
};

const arithmeticOps = {
  $add: "+",
  $subtract: "-",
  $multiply: "*",
  $divide: "/",
  $pow: "^",
  ...comparisonOps,
};

/**
 * Query is the base class of the query builder which defines a number of common
 * functionalities (such as compiling artitrary expressions or selectors), as well
 * as the generic compilation algorithm. This class is extended by several concrete
 * classes, each of which implements a particular type of Postgres query, such as
 * SelectQuery or CreateIndexQuery (these provide the interface that you want to
 * use as an end user).
 *
 * Once a query has been created, calling `query.compile()` will return a SQL
 * string and an array of arguments which can be passed into the Postgres client
 * for execution.
 *
 * The logic here is quite complex, so please add more unit tests with any new
 * features.
 *
 * The general approach is to construct an internal array of `Atoms` (see above)
 * each representing a small part of the query and which are concatonated when we
 * call `compile`. Due to the fact that `Query` is itself a type of `Atom`, this
 * process can be recursive. Arguments are also automatically converted to `$n`
 * references at compile time.
 */
abstract class Query<T extends DbObject> {
  protected syntheticFields: Record<string, Type> = {};
  protected nameSubqueries = true;
  protected isIndex = false;

  protected constructor(
    protected table: Table | Query<T>,
    protected atoms: Atom<T>[] = [],
  ) {}

  /**
   * `compile` is the main external interface provided by Query - it turns the
   * query into an executable SQL string and an array of arguments that together
   * can be passed into a SQL client for execution.
   *
   * `argOffset` specifies the numerical index to begin creating `$n` references at.
   *
   * `subqueryOffset` specifices the ASCII character code of the character to begin
   * labelling subqueries at.
   *
   * In general, external users should never need to provide values for these arguments
   * (you're _very_ likely to break something if you do), but they're provided in the
   * public API for flexability.
   */
  compile(argOffset = 0, subqueryOffset = 'A'.charCodeAt(0)): {sql: string, args: any[]} {
    const strings: string[] = [];
    let args: any[] = [];
    for (const atom of this.atoms) {
      if (atom instanceof Arg) {
        strings.push(`$${++argOffset}${atom.typehint}`);
        args.push(atom.value);
      } else if (atom instanceof Query) {
        strings.push("(");
        const subquery = this.nameSubqueries ? String.fromCharCode(subqueryOffset++) : "";
        const result = atom.compile(argOffset, subqueryOffset);
        strings.push(result.sql);
        args = args.concat(result.args);
        argOffset += result.args.length;
        strings.push(`) ${subquery}`);
      } else if (atom instanceof Table) {
        strings.push(`"${atom.getName()}"`);
      } else {
        strings.push(atom);
      }
    }
    return {
      sql: strings.join(" "),
      args,
    };
  }

  /**
   * Lookup a field in the current scope.
   */
  getField(name: string): Type | undefined {
    return this.getFields()[name] ?? this.table?.getField(name);
  }

  /**
   * Get all the fields defined in the current scope (does not return fields defined
   * in parent scopes).
   */
  getFields(): Record<string, Type> {
    return this.table instanceof Query ? this.table.syntheticFields : this.table.getFields();
  }

  /**
   * Internal helper to create a new Arg - allows us to encapsulate Arg
   * locally in this file.
   */
  protected createArg(value: any, type?: Type) {
    return new Arg(value, type);
  }

  /**
   * In complex queries, we (very) often need to provide typehints to make Postgres
   * happy (especially when using aggregations which result in subqueries with
   * synthetic fields). `getTypeHint` attempts to provide such a hint, returning the
   * empty string if one cannot be determined.
   *
   * If `typeHint` is an instance of `Type` then that type will be used, otherwise
   * `typeHint` is assumed to be the value we are getting the type for.
   */
  private getTypeHint(typeHint?: any): string {
    if (typeHint instanceof Type) {
      return "::" + typeHint.toConcrete().toString();
    }
    switch (typeof typeHint) {
      case "number":
        return Number.isInteger(typeHint) ? "::INTEGER" : "::REAL";
      case "string":
        return "::TEXT";
      case "boolean":
        return "::BOOL";
    }
    if (typeHint instanceof Date) {
      return "::TIMESTAMPTZ";
    }
    return "";
  }

  /**
   * Sometimes, we require two values to have the same type hint (for instance, when
   * using binary comparison operators), even if those values could be given more
   * precise type hints separately in isolation.
   */
  private getUnifiedTypeHint(a: Atom<T>[], b: Atom<T>[]): string | undefined {
    const aArg = a.find(atomIsArg);
    const bArg = b.find(atomIsArg);
    if (!aArg || !bArg || typeof aArg.value !== typeof bArg.value) {
      return undefined;
    }
    return this.getTypeHint(aArg.value);
  }

  /**
   * Table names must be correctly quoted to allow for capitalization.
   */
  protected resolveTableName(): string {
    return this.table instanceof Table ? `"${this.table.getName()}".` : "";
  }

  /**
   * Convert a Mongo selector field into a string that Postgres can understand. The
   * `field` may be a simple field name, or it may dereference a JSON object or
   * index an array.
   *
   * For valid values of the optional `typeHint`, see `getTypeHint`.
   */
  protected resolveFieldName(field: string, typeHint?: any): string {
    const arrayIndex = field.indexOf(".$");
    if (arrayIndex > -1) {
      throw new Error("`.$` array fields not implemented");
    }

    const jsonIndex = field.indexOf(".");
    if (jsonIndex > -1) {
      const [first, ...rest] = field.split(".");
      const fieldType = this.getField(first);
      if (fieldType instanceof ArrayType && !this.isIndex) {
        throw new NonScalarArrayAccessError(first, rest);
      } else if (fieldType) {
        return `("${first}"` +
          rest.map((element) => element.match(/^\d+$/) ? `[${element}]` : `->'${element}'`).join("") +
          `)${this.getTypeHint(typeHint)}`;
      }
    }

    if (this.getField(field)) {
      return `"${field}"`;
    }

    throw new Error(`Cannot resolve field name: ${field}`);
  }

  /**
   * Mongo is happy to treat arrays and scalar values as being effectively
   * interchangable, but Postgres is more picky. This helper allows us to
   * localize the special handling needed when we operate on a value that
   * is an array, despite not necessarily be marked as one explicitely in
   * the selector.
   */
  private arrayify(unresolvedField: string, resolvedField: string, op: string, value: any): Atom<T>[] {
    const ty = this.getField(unresolvedField);
    if (ty && ty.isArray() && !Array.isArray(value)) {
      if (op === "<>") {
        return [`NOT (${resolvedField} @> ARRAY[`, new Arg(value), "])"];
      } else if (op === "=") {
        return [`${resolvedField} @> ARRAY[`, new Arg(value), "]"];
      } else {
        throw new Error(`Invalid array operator: ${op}`);
      }
    } else {
      const hint = unresolvedField.indexOf(".") > 0 && resolvedField.indexOf("::") < 0 ? this.getTypeHint(value) : "";
      if (value === null) {
        if (op === "=") {
          return [`${resolvedField}${hint} IS NULL`];
        } else if (op === "<>") {
          return [`${resolvedField}${hint} IS NOT NULL`];
        }
      }
      return [`${resolvedField}${hint} ${op} `, new Arg(value)];
    }
  }

  /**
   * Mongo allows us to use selectors like `{"coauthorStatuses.userId": userId}`
   * (where `coauthorStatuses` is an array of JSONB) to match a record when any
   * item in the nested JSON matches the given scalar value. This requires special
   * handling in Postgres. This solution isn't particularly fast though - any
   * query that hits this code path would be a good place to consider writing some
   * better-optimized hand-rolled SQL.
   */
  private compileNonScalarArrayAccess(fieldName: string, path: string[], value: any): Atom<T>[] {
    path = path.map((element: string) => `'${element}'`);
    path.unshift("unnested");
    const last = path.pop();
    const selector = path.join("->") + "->>" + last;
    return [
      "(_id IN (SELECT _id FROM",
      this.table,
      `, UNNEST("${fieldName}") unnested WHERE ${selector} =`,
      this.createArg(value),
      "))",
    ];
  }

  /**
   * Compile an arbitrary Mongo selector into an array of atoms.
   * `this.atoms` is not modified.
   */
  private compileComparison(fieldName: string, value: any): Atom<T>[] {
    let field: string;
    try {
      field = this.resolveFieldName(fieldName, value);
    } catch (e) {
      if (e instanceof NonScalarArrayAccessError) {
        return this.compileNonScalarArrayAccess(e.fieldName, e.path, value);
      } else {
        throw e;
      }
    }

    if (value === undefined) {
      return ["1=1"];
    }

    if (value === null) {
      return [`${field} IS NULL`];
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length > 1) {
        return this.compileMultiSelector(keys.map((key) => ({[fieldName]: {[key]: value[key]}})), "AND");
      }

      const comparer = keys[0];
      switch (comparer) {
        case "$not":
          return ["NOT (", ...this.compileComparison(fieldName, value[comparer]), ")"];

        case "$nin":
          return this.compileComparison(fieldName, {$not: {$in: value[comparer]}});

        case "$in":
          if (!Array.isArray(value[comparer])) {
            throw new Error("$in expects an array");
          }
          const typeHint = this.getTypeHint(this.getField(fieldName));
          const args = value[comparer].flatMap((item: any) => [",", new Arg(item)]).slice(1);
          return [`ARRAY[`, ...args, `]${typeHint ? typeHint + "[]" : ""} @> ARRAY[${field}]`];

        case "$exists":
          return [`${field} ${value["$exists"] ? "IS NOT NULL" : "IS NULL"}`];

        case "$geoWithin":
          // We can be very specific here because this is only used in a single place in the codebase;
          // when we search for events within a certain maximum distance of the user ("nearbyEvents"
          // in posts/view.ts).
          // When converting this to Postgres, we actually want the location in the form of a raw
          // longitude and latitude, which isn't the case for Mongo. To do this, we pass the selector
          // to the query builder manually here using $comment. This is a hack, but it's the only
          // place in the codebase where we use this operator so it's probably not worth spending a
          // ton of time making this beautiful.
          const {$centerSphere: center, $comment: { locationName }} = value[comparer];
          if (!center || !Array.isArray(center) || center.length !== 2 || !locationName) {
            throw new Error("Invalid $geoWithin selector");
          }
          const [lng, lat] = center[0];
          const distance = center[1];
          return [
            `(EARTH_DISTANCE(LL_TO_EARTH((${locationName}->>'lng')::FLOAT8, (${locationName}->>'lat')::FLOAT8),`,
            "LL_TO_EARTH(",
            this.createArg(lng),
            ",",
            this.createArg(lat),
            ")) * 0.000621371) <", // Convert metres to miles
            this.createArg(distance),
          ];

        default:
          break;
      }

      const op = comparisonOps[comparer];
      if (op) {
        return this.arrayify(fieldName, field, op, value[comparer]);
      } else {
        throw new Error(`Invalid comparison selector: ${field}: ${JSON.stringify(value)}`);
      }
    }

    return this.arrayify(fieldName, field, "=", value);
  }

  /**
   * Recursively merge logically combined selectors (such as $and or $or) into a flat
   * Atom array.
   */
  private compileMultiSelector(multiSelector: MongoSelector<T>, separator: string): Atom<T>[] {
    const result = Array.isArray(multiSelector)
      ? multiSelector.map((selector) => this.compileSelector(selector))
      : Object.keys(multiSelector).map(
        (key) => this.compileSelector({[key]: multiSelector[key]})
      );
    return [
      "(",
      ...result.filter((a) => a.length).flatMap((item) => [separator, ...item]).slice(1),
      ")",
    ];
  }

  /**
   * Compile an arbitrary Mongo selector into an array of atoms.
   * `this.atoms` is not modified.
   */
  protected compileSelector(selector: MongoSelector<T>): Atom<T>[] {
    const keys = Object.keys(selector);
    if (keys.length === 0) {
      return [];
    } else if (keys.length > 1) {
      return this.compileSelector({ $and: selector });
    }

    const key = keys[0];
    const value = selector[key];
    switch (key) {
      case "$and":
        return this.compileMultiSelector(value, "AND");
      case "$or":
        return this.compileMultiSelector(value, "OR");
      case "$expr":
        return this.compileExpression(value);
      case "$comment":
        return [];
    }

    return this.compileComparison(key, value);
  }

  /**
   * Compile the given selector and append it to `this.atoms`.
   */
  protected appendSelector(selector: MongoSelector<T>): void {
    this.atoms = this.atoms.concat(this.compileSelector(selector));
  }

  /**
   * Compile a conditional expression (used internally by `compileExpression` to handle
   * $cond statements).
   */
  private compileCondition(expr: any): Atom<T>[] {
    if (typeof expr === "string" && expr[0] === "$") {
      const name = expr.slice(1);
      return [this.resolveFieldName(name), "IS NOT NULL"];
    }
    return this.compileExpression(expr);
  }

  /**
   * Compile an arbitrary Mongo expression into an array of atoms.
   * `this.atoms` is not modified.
   */
  protected compileExpression(expr: any, typeHint?: any): Atom<T>[] {
    if (typeof expr === "string") {
      return [expr[0] === "$" ? this.resolveFieldName(expr.slice(1), typeHint) : new Arg(expr)];
    } else if (typeof expr !== "object" || expr === null || expr instanceof Date || Array.isArray(expr)) {
      return [new Arg(expr)];
    }

    const op = Object.keys(expr)[0];
    if (op?.[0] !== "$") {
      return [new Arg({[op]: expr[op]})]
    }

    if (arithmeticOps[op]) {
      const isMagnitude = isMagnitudeOp(op);
      const operands = expr[op].map((arg: any) => this.compileExpression(arg, isMagnitude ? 0 : undefined));
      const isDateDiff = op === "$subtract" && operands.length === 2 && operands.some(
        (arr: Atom<T>[]) => arr.some((atom) => atom instanceof Arg && atom.value instanceof Date)
      );
      let result: Atom<T>[] = [isDateDiff ? "(1000 * EXTRACT(EPOCH FROM" : "("];
      for (let i = 0; i < operands.length; i++) {
        if (i > 0) {
          result.push(arithmeticOps[op]);
        }
        result = result.concat(operands[i]);
      }
      result.push(isDateDiff ? "))" : ")");
      return result;
    }

    if (op === "$cond") {
      const ifExpr = this.compileCondition(expr[op].if);
      const thenExpr = this.compileExpression(expr[op].then);
      const elseExpr = this.compileExpression(expr[op].else);
      const hint = this.getUnifiedTypeHint(thenExpr, elseExpr);
      const result = ["(CASE WHEN", ...ifExpr, "THEN", ...thenExpr, "ELSE", ...elseExpr, "END)"];
      return hint ? [...result, hint] : result;
    }

    if (op === "$abs") {
      return ["ABS(", ...this.compileExpression(expr[op]), ")"];
    }

    if (op === "$sum") {
      return ["SUM(", ...this.compileExpression(expr[op]), ")"];
    }

    if (op === "$in") {
      const [value, array] = expr[op];
      return [...this.compileExpression(array), "@> {", ...this.compileExpression(value), "}"];
    }

    // This algorithm is over-specialized, but we only seem to use it in a very particular way...
    if (op === "$arrayElemAt") {
      const [array, index] = expr[op];
      if (typeof array !== "string" || array[0] !== "$" || typeof index !== "number") {
        throw new Error("Invalid arguments to $arrayElemAt");
      }
      const tokens = array.split(".");
      const field = tokens[0][0] === "$" ? tokens[0].slice(1) : tokens[0];
      const path = tokens.slice(1).flatMap((name) => ["->", `'${name}'`]);
      if (path.length) {
        path[path.length - 2] = "->>";
      }
      return [`("${field}")[${index}]${path.join("")}`];
    }

    if (op === "$first") {
      return this.compileExpression(expr[op]);
    }

    if (op === undefined) {
      return ["'{}'::JSONB"];
    }

    throw new Error(`Invalid expression: ${JSON.stringify(expr)}`);
  }
}

export default Query;
