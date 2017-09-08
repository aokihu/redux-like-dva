/**
 * @author aokihu aokihu@gmail.com
 * @version 1.0.0
 */
const redux = require('redux');
const saga = require('redux-saga');
const {createStore, combineReducers,applyMiddleware,} = redux;
const {takeEvery, takeLatest } = saga.effects;
const createSagaMiddleware = saga.default;
const sagaEffects = saga.effects;

// User defines reducer and sagas
const _reducers = {};
const _sagas = {};

// User defines data model
const _models = [];

// Watch any effects
function *runSaga ( store, sagas ){
  const keys = Object.keys(sagas);
  yield keys.map( function*( key ) {
    yield takeLatest( key, function*( action ){
      const namespace = action.type.split( '/' )[0];
      const state = store.getState()[namespace];
      // TODO 注入effects的方法
      yield sagas[key]( Object.assign({}, action, state) , Object.assign({}, sagaEffects, takeEvery, takeLatest) );
    } );
  } );
}

module.exports = {
  /**
   * @func add
   * @abstract  Add model to store
   * @param {dva redux model} model Reducer and sagas define mode
   */
  add(model){_models.push(model)},
  /**
   * @func initStore
   * @abstract this function have to be executed after add function
   */
  initStore(){

    let initState = {};

    _models.map(item => {
      // These field is like dva
      const {namespace, state, reducers, effects,} = item;

      // TODO Initialize state under the namespace
      initState[namespace] = state;

      // TODO Initialize reducers
      _reducers[namespace] = function ( state = {}, action ){
        const {type,} = action;
        const [ domain, act, ] = type.split( '/' );
        const handler = reducers[act];

        if( domain === namespace && !!handler ){
          return handler( state, action );
        }else{
          return state;
        }
      };

      // TODO add 'lastAction'
      _reducers['lastAction'] = ( state = null, action ) => action;

      // TODO Initialize sagas
      const effectKeys = Object.keys(effects);
      effectKeys.map( key => {
        const newKey = `${namespace}/${key}`;
        _sagas[newKey] = effects[key];
      } );

    });

    // TODO Use saga middleware
    const sagaMiddleware = createSagaMiddleware();


    // TODO Create store
    const Store = createStore(
      combineReducers( _reducers ),
      initState ,
      applyMiddleware( sagaMiddleware )
    );


    // TODO Mount
    sagaMiddleware.run( function*(){
      yield runSaga(  Store, _sagas );
    } );

    return Store;
  }
}
