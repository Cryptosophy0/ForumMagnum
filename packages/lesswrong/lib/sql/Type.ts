import { getCollection } from "../vulcan-lib/getCollection";
import GraphQLJSON from 'graphql-type-json';
import SimpleSchema from "simpl-schema";

const forceNonResolverFields = ["contents", "moderationGuidelines", "customHighlight", "originalContents"];

export const isResolverOnly =
  <T extends DbObject>(fieldName: string, schema: CollectionFieldSpecification<T>) =>
    schema.resolveAs && !schema.resolveAs.addOriginalField && forceNonResolverFields.indexOf(fieldName) < 0;

/**
 * The Type classes models data types as they exist in Postgres.
 */
export abstract class Type {
  /**
   * Convert the Type to a Postgres type name
   */
  abstract toString(): string;

  /**
   * Convert this Type to a "concrete" Type - that is, remove any metadata
   * like nullability or default values to leave a raw column type.
   */
  toConcrete(): Type {
    return this;
  }

  isArray(): this is ArrayType {
    return false;
  }

  /**
   * In order to emulate Mongo's upsert semantics, we sometimes have to
   * use coalesce inside indexes. See `CreateIndexQuery.fieldNameToIndexField`.
   */
  getIndexCoalesceValue(): string | null {
    return null;
  }

  static fromSchema<T extends DbObject>(
    fieldName: string,
    schema: CollectionFieldSpecification<T>,
    indexSchema?: CollectionFieldSpecification<T>,
  ) {
    if (isResolverOnly(fieldName, schema)) {
      throw new Error("Can't generate type for resolver-only field");
    }

    if (schema.defaultValue !== undefined && schema.defaultValue !== null) {
      const {defaultValue, ...rest} = schema;
      return new DefaultValueType(Type.fromSchema(fieldName, rest, indexSchema), defaultValue);
    }

    if (schema.optional === false || schema.nullable === false) {
      return new NotNullType(Type.fromSchema(fieldName, {...schema, optional: true}, indexSchema));
    }

    switch (schema.type) {
      case String:
        return typeof schema.foreignKey === "string"
          ? new IdType(getCollection(schema.foreignKey as CollectionNameString))
          : new StringType(typeof schema.max === "number" ? schema.max : undefined);
      case Boolean:
        return new BoolType();
      case Date:
        return new DateType();
      case Number:
        return new FloatType();
      case "SimpleSchema.Integer":
        return new IntType();
      case Object: case GraphQLJSON:
        return new JsonType();
      case Array:
        if (!indexSchema) {
          throw new Error("No schema type provided for array member");
        }
        return new ArrayType(Type.fromSchema(fieldName + ".$", indexSchema));
    }

    if (schema.type instanceof SimpleSchema) {
      return new JsonType();
    }

    throw new Error(`Unrecognized schema: ${JSON.stringify(schema)}`);
  }
}

export class StringType extends Type {
  constructor(private maxLength?: number) {
    super();
  }

  toString() {
    return this.maxLength === undefined ? "TEXT" : `VARCHAR(${this.maxLength})`;
  }

  getIndexCoalesceValue(): string | null {
    return "''";
  }
}

export class BoolType extends Type {
  toString() {
    return "BOOL";
  }
}

export class IntType extends Type {
  toString() {
    return "INTEGER";
  }
}

export class FloatType extends Type {
  toString() {
    return "REAL";
  }
}

export class DateType extends Type {
  toString() {
    return "TIMESTAMPTZ";
  }
}

export class JsonType extends Type {
  toString() {
    return "JSONB";
  }
}

export class ArrayType extends Type {
  subtype: Type;

  constructor(subtype: Type) {
    super();
    this.subtype = subtype.toConcrete();
  }

  toString() {
    return `${this.subtype.toString()}[]`;
  }

  isArray() {
    return true;
  }
}

/**
 * IdType is a convinience type to automatically make sure Vulcan
 * ID fields are stored correctly and efficiently
 */
export class IdType extends StringType {
  constructor(private collection: CollectionBase<any>) {
    super(27);
  }

  getCollection() {
    return this.collection;
  }
}

/**
 * Annotate a type as being non-nullable. Subtype may or may not be concrete.
 */
export class NotNullType extends Type {
  constructor(private type: Type) {
    super();
  }

  toString() {
    return `${this.type.toString()} NOT NULL`;
  }

  toConcrete() {
    return this.type.toConcrete();
  }

  isArray() {
    return this.type.isArray();
  }
}

// FIXME there are bugs here, but don't try and fix them as part of this
const valueToString = (value: any, subtype?: Type): string => {
  if (Array.isArray(value) && value.length === 0) {
    return subtype ? `'{}'::${subtype.toString()}[]` : "'{}'";
  } else if (typeof value === "string") {
    return `'${value}'`;
  } else if (typeof value === "object" && value) {
    return `'{${Object.keys(value).map((key) => `"${key}": ${valueToString(value[key])}`).join(",")}}'`;
  }
  return `${value}`;
}

/**
 * Annotate a type as having a default value. Subtype may or may not be concrete.
 */
export class DefaultValueType extends Type {
  constructor(private type: Type, private value: any) {
    super();
  }

  toString() {
    return `${this.type.toString()} DEFAULT ${this.valueToString()}`;
  }

  private valueToString() {
    return valueToString(this.value, this.type.isArray() ? this.type.subtype : undefined);
  }

  toConcrete() {
    return this.type.toConcrete();
  }

  isArray(): this is ArrayType {
    return this.type.isArray();
  }
}

/**
 * An unknown type. This is used as an implementation detail inside the query builder
 * and should not be used externally. If you see UnknownType appear in an error message
 * then you've probably hit a serious query builder bug.
 */
export class UnknownType extends Type {
  constructor() {
    super();
  }

  toString(): never {
    throw new Error("Cannot convert unknown type to string");
  }
}
