import { getCollection } from '../vulcan-lib/getCollection';
import { loggerConstructor } from './logging'
import { viewFieldNullOrMissing, viewFieldAllowAny } from '../vulcan-lib/collections';
import { DatabasePublicSetting } from '../publicSettings';
import * as _ from 'underscore';
import merge from 'lodash/merge';

// 'Maximum documents per request'
const maxDocumentsPerRequestSetting = new DatabasePublicSetting<number>('maxDocumentsPerRequest', 5000)

// Given a view (which gets translated into a mongo query), provide a string
// which describes what's being queried (ie the view name, and a list of
// parameters that were attached, but not the values of those parameters). This
// is attached to the mongodb query by putting a $comment in the selector, so
// that when we see slow queries in the profiler, we can easily identify the
// source.
export function describeTerms(terms: ViewTermsBase) {
  const viewName = terms.view || "defaultView";
  const otherTerms = Object.keys(terms).filter(key => key!=='view').join(',');
  if (otherTerms.length>0)
    return `${viewName}(${otherTerms})`;
  else
    return viewName;
}

export function viewTermsToQuery<N extends CollectionNameString>(collectionName: N, terms: ViewTermsByCollectionName[N], apolloClient?: any, resolverContext?: ResolverContext) {
  const collection = getCollection(collectionName);
  return getParameters(collection, terms, apolloClient, resolverContext);
}

export function getDefaultViewSelector<N extends CollectionNameString>(collectionName: N) {
  const viewQuery = viewTermsToQuery(collectionName, {})
  // TODO: Postprocess out viewFieldNullOrMissing
  return viewQuery.selector;
}

function getParameters<N extends CollectionNameString, T extends DbObject=ObjectsByCollectionName[N]>(
  collection: CollectionBase<T>,
  terms: ViewTermsByCollectionName[N] = {},
  apolloClient?: any,
  context?: ResolverContext
): MergedViewQueryAndOptions<N,T> {
  const collectionName = collection.collectionName;
  const logger = loggerConstructor(`views-${collectionName.toLowerCase()}`)
  logger('getParameters(), terms:', terms);

  let parameters: any = {
    selector: {},
    options: {},
  };

  if (collection.defaultView) {
    parameters = merge(
      parameters,
      collection.defaultView(terms, apolloClient, context)
    );
    logger('getParameters(), parameters after defaultView:', parameters)
  }

  // handle view option
  if (terms.view && collection.views[terms.view]) {
    const viewFn = collection.views[terms.view];
    const view = viewFn(terms, apolloClient, context);
    let mergedParameters = merge(parameters, view);

    if (
      mergedParameters.options &&
      mergedParameters.options.sort &&
      view.options &&
      view.options.sort
    ) {
      // If both the default view and the selected view have sort options,
      // don't merge them together; take the selected view's sort. (Otherwise
      // they merge in the wrong order, so that the default-view's sort takes
      // precedence over the selected view's sort.)
      mergedParameters.options.sort = view.options.sort;
    }
    parameters = mergedParameters;
    logger('getParameters(), parameters after defaultView and view:', parameters)
  }

  // sort using terms.orderBy (overwrite defaultView's sort)
  if (terms.orderBy && !_.isEmpty(terms.orderBy)) {
    parameters.options.sort = terms.orderBy;
  }

  // if there is no sort, default to sorting by createdAt descending
  if (!parameters.options.sort) {
    parameters.options.sort = { createdAt: -1 } as any;
  }

  // extend sort to sort posts by _id to break ties, unless there's already an id sort
  // NOTE: always do this last to avoid overriding another sort
  if (!(parameters.options.sort && typeof parameters.options.sort._id !== undefined)) {
    parameters = merge(parameters, { options: { sort: { _id: -1 } } });
  }

  // remove any null fields (setting a field to null means it should be deleted)
  _.keys(parameters.selector).forEach(key => {
    if (_.isEqual(parameters.selector[key], viewFieldNullOrMissing)) {
      parameters.selector[key] = null;
    } else if (_.isEqual(parameters.selector[key], viewFieldAllowAny)) {
      delete parameters.selector[key];
    } else if (parameters.selector[key] === null || parameters.selector[key] === undefined) {
      //console.log(`Warning: Null key ${key} in query of collection ${collectionName} with view ${terms.view}.`);
      delete parameters.selector[key];
    }
  });
  if (parameters.options.sort) {
    _.keys(parameters.options.sort).forEach(key => {
      if (parameters.options.sort[key] === null) {
        delete parameters.options.sort[key];
      }
    });
  }

  // limit number of items to 1000 by default
  const maxDocuments = maxDocumentsPerRequestSetting.get();
  const limit = terms.limit || parameters.options.limit;
  parameters.options.limit = !limit || limit < 1 || limit > maxDocuments ? maxDocuments : limit;

  logger('getParameters(), final parameters:', parameters);
  return parameters;
}
