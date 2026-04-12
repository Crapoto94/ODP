
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model BacklogItem
 * 
 */
export type BacklogItem = $Result.DefaultSelection<Prisma.$BacklogItemPayload>
/**
 * Model BacklogComment
 * 
 */
export type BacklogComment = $Result.DefaultSelection<Prisma.$BacklogCommentPayload>
/**
 * Model VersionRelease
 * 
 */
export type VersionRelease = $Result.DefaultSelection<Prisma.$VersionReleasePayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more BacklogItems
 * const backlogItems = await prisma.backlogItem.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more BacklogItems
   * const backlogItems = await prisma.backlogItem.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.backlogItem`: Exposes CRUD operations for the **BacklogItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BacklogItems
    * const backlogItems = await prisma.backlogItem.findMany()
    * ```
    */
  get backlogItem(): Prisma.BacklogItemDelegate<ExtArgs>;

  /**
   * `prisma.backlogComment`: Exposes CRUD operations for the **BacklogComment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BacklogComments
    * const backlogComments = await prisma.backlogComment.findMany()
    * ```
    */
  get backlogComment(): Prisma.BacklogCommentDelegate<ExtArgs>;

  /**
   * `prisma.versionRelease`: Exposes CRUD operations for the **VersionRelease** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VersionReleases
    * const versionReleases = await prisma.versionRelease.findMany()
    * ```
    */
  get versionRelease(): Prisma.VersionReleaseDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    BacklogItem: 'BacklogItem',
    BacklogComment: 'BacklogComment',
    VersionRelease: 'VersionRelease'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "backlogItem" | "backlogComment" | "versionRelease"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      BacklogItem: {
        payload: Prisma.$BacklogItemPayload<ExtArgs>
        fields: Prisma.BacklogItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BacklogItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BacklogItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogItemPayload>
          }
          findFirst: {
            args: Prisma.BacklogItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BacklogItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogItemPayload>
          }
          findMany: {
            args: Prisma.BacklogItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogItemPayload>[]
          }
          create: {
            args: Prisma.BacklogItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogItemPayload>
          }
          createMany: {
            args: Prisma.BacklogItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BacklogItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogItemPayload>[]
          }
          delete: {
            args: Prisma.BacklogItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogItemPayload>
          }
          update: {
            args: Prisma.BacklogItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogItemPayload>
          }
          deleteMany: {
            args: Prisma.BacklogItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BacklogItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BacklogItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogItemPayload>
          }
          aggregate: {
            args: Prisma.BacklogItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBacklogItem>
          }
          groupBy: {
            args: Prisma.BacklogItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<BacklogItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.BacklogItemCountArgs<ExtArgs>
            result: $Utils.Optional<BacklogItemCountAggregateOutputType> | number
          }
        }
      }
      BacklogComment: {
        payload: Prisma.$BacklogCommentPayload<ExtArgs>
        fields: Prisma.BacklogCommentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BacklogCommentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogCommentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BacklogCommentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogCommentPayload>
          }
          findFirst: {
            args: Prisma.BacklogCommentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogCommentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BacklogCommentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogCommentPayload>
          }
          findMany: {
            args: Prisma.BacklogCommentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogCommentPayload>[]
          }
          create: {
            args: Prisma.BacklogCommentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogCommentPayload>
          }
          createMany: {
            args: Prisma.BacklogCommentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BacklogCommentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogCommentPayload>[]
          }
          delete: {
            args: Prisma.BacklogCommentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogCommentPayload>
          }
          update: {
            args: Prisma.BacklogCommentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogCommentPayload>
          }
          deleteMany: {
            args: Prisma.BacklogCommentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BacklogCommentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BacklogCommentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BacklogCommentPayload>
          }
          aggregate: {
            args: Prisma.BacklogCommentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBacklogComment>
          }
          groupBy: {
            args: Prisma.BacklogCommentGroupByArgs<ExtArgs>
            result: $Utils.Optional<BacklogCommentGroupByOutputType>[]
          }
          count: {
            args: Prisma.BacklogCommentCountArgs<ExtArgs>
            result: $Utils.Optional<BacklogCommentCountAggregateOutputType> | number
          }
        }
      }
      VersionRelease: {
        payload: Prisma.$VersionReleasePayload<ExtArgs>
        fields: Prisma.VersionReleaseFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VersionReleaseFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionReleasePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VersionReleaseFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionReleasePayload>
          }
          findFirst: {
            args: Prisma.VersionReleaseFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionReleasePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VersionReleaseFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionReleasePayload>
          }
          findMany: {
            args: Prisma.VersionReleaseFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionReleasePayload>[]
          }
          create: {
            args: Prisma.VersionReleaseCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionReleasePayload>
          }
          createMany: {
            args: Prisma.VersionReleaseCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VersionReleaseCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionReleasePayload>[]
          }
          delete: {
            args: Prisma.VersionReleaseDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionReleasePayload>
          }
          update: {
            args: Prisma.VersionReleaseUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionReleasePayload>
          }
          deleteMany: {
            args: Prisma.VersionReleaseDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VersionReleaseUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.VersionReleaseUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionReleasePayload>
          }
          aggregate: {
            args: Prisma.VersionReleaseAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVersionRelease>
          }
          groupBy: {
            args: Prisma.VersionReleaseGroupByArgs<ExtArgs>
            result: $Utils.Optional<VersionReleaseGroupByOutputType>[]
          }
          count: {
            args: Prisma.VersionReleaseCountArgs<ExtArgs>
            result: $Utils.Optional<VersionReleaseCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type BacklogItemCountOutputType
   */

  export type BacklogItemCountOutputType = {
    comments: number
  }

  export type BacklogItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comments?: boolean | BacklogItemCountOutputTypeCountCommentsArgs
  }

  // Custom InputTypes
  /**
   * BacklogItemCountOutputType without action
   */
  export type BacklogItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItemCountOutputType
     */
    select?: BacklogItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BacklogItemCountOutputType without action
   */
  export type BacklogItemCountOutputTypeCountCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BacklogCommentWhereInput
  }


  /**
   * Count Type VersionReleaseCountOutputType
   */

  export type VersionReleaseCountOutputType = {
    backlogItems: number
  }

  export type VersionReleaseCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    backlogItems?: boolean | VersionReleaseCountOutputTypeCountBacklogItemsArgs
  }

  // Custom InputTypes
  /**
   * VersionReleaseCountOutputType without action
   */
  export type VersionReleaseCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionReleaseCountOutputType
     */
    select?: VersionReleaseCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * VersionReleaseCountOutputType without action
   */
  export type VersionReleaseCountOutputTypeCountBacklogItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BacklogItemWhereInput
  }


  /**
   * Models
   */

  /**
   * Model BacklogItem
   */

  export type AggregateBacklogItem = {
    _count: BacklogItemCountAggregateOutputType | null
    _avg: BacklogItemAvgAggregateOutputType | null
    _sum: BacklogItemSumAggregateOutputType | null
    _min: BacklogItemMinAggregateOutputType | null
    _max: BacklogItemMaxAggregateOutputType | null
  }

  export type BacklogItemAvgAggregateOutputType = {
    id: number | null
    versionId: number | null
  }

  export type BacklogItemSumAggregateOutputType = {
    id: number | null
    versionId: number | null
  }

  export type BacklogItemMinAggregateOutputType = {
    id: number | null
    title: string | null
    description: string | null
    type: string | null
    priority: string | null
    status: string | null
    versionId: number | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type BacklogItemMaxAggregateOutputType = {
    id: number | null
    title: string | null
    description: string | null
    type: string | null
    priority: string | null
    status: string | null
    versionId: number | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type BacklogItemCountAggregateOutputType = {
    id: number
    title: number
    description: number
    type: number
    priority: number
    status: number
    versionId: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type BacklogItemAvgAggregateInputType = {
    id?: true
    versionId?: true
  }

  export type BacklogItemSumAggregateInputType = {
    id?: true
    versionId?: true
  }

  export type BacklogItemMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    type?: true
    priority?: true
    status?: true
    versionId?: true
    created_at?: true
    updated_at?: true
  }

  export type BacklogItemMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    type?: true
    priority?: true
    status?: true
    versionId?: true
    created_at?: true
    updated_at?: true
  }

  export type BacklogItemCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    type?: true
    priority?: true
    status?: true
    versionId?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type BacklogItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BacklogItem to aggregate.
     */
    where?: BacklogItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BacklogItems to fetch.
     */
    orderBy?: BacklogItemOrderByWithRelationInput | BacklogItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BacklogItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BacklogItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BacklogItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BacklogItems
    **/
    _count?: true | BacklogItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BacklogItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BacklogItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BacklogItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BacklogItemMaxAggregateInputType
  }

  export type GetBacklogItemAggregateType<T extends BacklogItemAggregateArgs> = {
        [P in keyof T & keyof AggregateBacklogItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBacklogItem[P]>
      : GetScalarType<T[P], AggregateBacklogItem[P]>
  }




  export type BacklogItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BacklogItemWhereInput
    orderBy?: BacklogItemOrderByWithAggregationInput | BacklogItemOrderByWithAggregationInput[]
    by: BacklogItemScalarFieldEnum[] | BacklogItemScalarFieldEnum
    having?: BacklogItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BacklogItemCountAggregateInputType | true
    _avg?: BacklogItemAvgAggregateInputType
    _sum?: BacklogItemSumAggregateInputType
    _min?: BacklogItemMinAggregateInputType
    _max?: BacklogItemMaxAggregateInputType
  }

  export type BacklogItemGroupByOutputType = {
    id: number
    title: string
    description: string | null
    type: string
    priority: string
    status: string
    versionId: number | null
    created_at: Date
    updated_at: Date
    _count: BacklogItemCountAggregateOutputType | null
    _avg: BacklogItemAvgAggregateOutputType | null
    _sum: BacklogItemSumAggregateOutputType | null
    _min: BacklogItemMinAggregateOutputType | null
    _max: BacklogItemMaxAggregateOutputType | null
  }

  type GetBacklogItemGroupByPayload<T extends BacklogItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BacklogItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BacklogItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BacklogItemGroupByOutputType[P]>
            : GetScalarType<T[P], BacklogItemGroupByOutputType[P]>
        }
      >
    >


  export type BacklogItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    type?: boolean
    priority?: boolean
    status?: boolean
    versionId?: boolean
    created_at?: boolean
    updated_at?: boolean
    version?: boolean | BacklogItem$versionArgs<ExtArgs>
    comments?: boolean | BacklogItem$commentsArgs<ExtArgs>
    _count?: boolean | BacklogItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["backlogItem"]>

  export type BacklogItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    type?: boolean
    priority?: boolean
    status?: boolean
    versionId?: boolean
    created_at?: boolean
    updated_at?: boolean
    version?: boolean | BacklogItem$versionArgs<ExtArgs>
  }, ExtArgs["result"]["backlogItem"]>

  export type BacklogItemSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    type?: boolean
    priority?: boolean
    status?: boolean
    versionId?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type BacklogItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    version?: boolean | BacklogItem$versionArgs<ExtArgs>
    comments?: boolean | BacklogItem$commentsArgs<ExtArgs>
    _count?: boolean | BacklogItemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type BacklogItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    version?: boolean | BacklogItem$versionArgs<ExtArgs>
  }

  export type $BacklogItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BacklogItem"
    objects: {
      version: Prisma.$VersionReleasePayload<ExtArgs> | null
      comments: Prisma.$BacklogCommentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      title: string
      description: string | null
      type: string
      priority: string
      status: string
      versionId: number | null
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["backlogItem"]>
    composites: {}
  }

  type BacklogItemGetPayload<S extends boolean | null | undefined | BacklogItemDefaultArgs> = $Result.GetResult<Prisma.$BacklogItemPayload, S>

  type BacklogItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<BacklogItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: BacklogItemCountAggregateInputType | true
    }

  export interface BacklogItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BacklogItem'], meta: { name: 'BacklogItem' } }
    /**
     * Find zero or one BacklogItem that matches the filter.
     * @param {BacklogItemFindUniqueArgs} args - Arguments to find a BacklogItem
     * @example
     * // Get one BacklogItem
     * const backlogItem = await prisma.backlogItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BacklogItemFindUniqueArgs>(args: SelectSubset<T, BacklogItemFindUniqueArgs<ExtArgs>>): Prisma__BacklogItemClient<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one BacklogItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {BacklogItemFindUniqueOrThrowArgs} args - Arguments to find a BacklogItem
     * @example
     * // Get one BacklogItem
     * const backlogItem = await prisma.backlogItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BacklogItemFindUniqueOrThrowArgs>(args: SelectSubset<T, BacklogItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BacklogItemClient<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first BacklogItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogItemFindFirstArgs} args - Arguments to find a BacklogItem
     * @example
     * // Get one BacklogItem
     * const backlogItem = await prisma.backlogItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BacklogItemFindFirstArgs>(args?: SelectSubset<T, BacklogItemFindFirstArgs<ExtArgs>>): Prisma__BacklogItemClient<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first BacklogItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogItemFindFirstOrThrowArgs} args - Arguments to find a BacklogItem
     * @example
     * // Get one BacklogItem
     * const backlogItem = await prisma.backlogItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BacklogItemFindFirstOrThrowArgs>(args?: SelectSubset<T, BacklogItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__BacklogItemClient<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more BacklogItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BacklogItems
     * const backlogItems = await prisma.backlogItem.findMany()
     * 
     * // Get first 10 BacklogItems
     * const backlogItems = await prisma.backlogItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const backlogItemWithIdOnly = await prisma.backlogItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BacklogItemFindManyArgs>(args?: SelectSubset<T, BacklogItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a BacklogItem.
     * @param {BacklogItemCreateArgs} args - Arguments to create a BacklogItem.
     * @example
     * // Create one BacklogItem
     * const BacklogItem = await prisma.backlogItem.create({
     *   data: {
     *     // ... data to create a BacklogItem
     *   }
     * })
     * 
     */
    create<T extends BacklogItemCreateArgs>(args: SelectSubset<T, BacklogItemCreateArgs<ExtArgs>>): Prisma__BacklogItemClient<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many BacklogItems.
     * @param {BacklogItemCreateManyArgs} args - Arguments to create many BacklogItems.
     * @example
     * // Create many BacklogItems
     * const backlogItem = await prisma.backlogItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BacklogItemCreateManyArgs>(args?: SelectSubset<T, BacklogItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BacklogItems and returns the data saved in the database.
     * @param {BacklogItemCreateManyAndReturnArgs} args - Arguments to create many BacklogItems.
     * @example
     * // Create many BacklogItems
     * const backlogItem = await prisma.backlogItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BacklogItems and only return the `id`
     * const backlogItemWithIdOnly = await prisma.backlogItem.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BacklogItemCreateManyAndReturnArgs>(args?: SelectSubset<T, BacklogItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a BacklogItem.
     * @param {BacklogItemDeleteArgs} args - Arguments to delete one BacklogItem.
     * @example
     * // Delete one BacklogItem
     * const BacklogItem = await prisma.backlogItem.delete({
     *   where: {
     *     // ... filter to delete one BacklogItem
     *   }
     * })
     * 
     */
    delete<T extends BacklogItemDeleteArgs>(args: SelectSubset<T, BacklogItemDeleteArgs<ExtArgs>>): Prisma__BacklogItemClient<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one BacklogItem.
     * @param {BacklogItemUpdateArgs} args - Arguments to update one BacklogItem.
     * @example
     * // Update one BacklogItem
     * const backlogItem = await prisma.backlogItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BacklogItemUpdateArgs>(args: SelectSubset<T, BacklogItemUpdateArgs<ExtArgs>>): Prisma__BacklogItemClient<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more BacklogItems.
     * @param {BacklogItemDeleteManyArgs} args - Arguments to filter BacklogItems to delete.
     * @example
     * // Delete a few BacklogItems
     * const { count } = await prisma.backlogItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BacklogItemDeleteManyArgs>(args?: SelectSubset<T, BacklogItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BacklogItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BacklogItems
     * const backlogItem = await prisma.backlogItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BacklogItemUpdateManyArgs>(args: SelectSubset<T, BacklogItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one BacklogItem.
     * @param {BacklogItemUpsertArgs} args - Arguments to update or create a BacklogItem.
     * @example
     * // Update or create a BacklogItem
     * const backlogItem = await prisma.backlogItem.upsert({
     *   create: {
     *     // ... data to create a BacklogItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BacklogItem we want to update
     *   }
     * })
     */
    upsert<T extends BacklogItemUpsertArgs>(args: SelectSubset<T, BacklogItemUpsertArgs<ExtArgs>>): Prisma__BacklogItemClient<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of BacklogItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogItemCountArgs} args - Arguments to filter BacklogItems to count.
     * @example
     * // Count the number of BacklogItems
     * const count = await prisma.backlogItem.count({
     *   where: {
     *     // ... the filter for the BacklogItems we want to count
     *   }
     * })
    **/
    count<T extends BacklogItemCountArgs>(
      args?: Subset<T, BacklogItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BacklogItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BacklogItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BacklogItemAggregateArgs>(args: Subset<T, BacklogItemAggregateArgs>): Prisma.PrismaPromise<GetBacklogItemAggregateType<T>>

    /**
     * Group by BacklogItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BacklogItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BacklogItemGroupByArgs['orderBy'] }
        : { orderBy?: BacklogItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BacklogItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBacklogItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BacklogItem model
   */
  readonly fields: BacklogItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BacklogItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BacklogItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    version<T extends BacklogItem$versionArgs<ExtArgs> = {}>(args?: Subset<T, BacklogItem$versionArgs<ExtArgs>>): Prisma__VersionReleaseClient<$Result.GetResult<Prisma.$VersionReleasePayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    comments<T extends BacklogItem$commentsArgs<ExtArgs> = {}>(args?: Subset<T, BacklogItem$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BacklogCommentPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BacklogItem model
   */ 
  interface BacklogItemFieldRefs {
    readonly id: FieldRef<"BacklogItem", 'Int'>
    readonly title: FieldRef<"BacklogItem", 'String'>
    readonly description: FieldRef<"BacklogItem", 'String'>
    readonly type: FieldRef<"BacklogItem", 'String'>
    readonly priority: FieldRef<"BacklogItem", 'String'>
    readonly status: FieldRef<"BacklogItem", 'String'>
    readonly versionId: FieldRef<"BacklogItem", 'Int'>
    readonly created_at: FieldRef<"BacklogItem", 'DateTime'>
    readonly updated_at: FieldRef<"BacklogItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BacklogItem findUnique
   */
  export type BacklogItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemInclude<ExtArgs> | null
    /**
     * Filter, which BacklogItem to fetch.
     */
    where: BacklogItemWhereUniqueInput
  }

  /**
   * BacklogItem findUniqueOrThrow
   */
  export type BacklogItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemInclude<ExtArgs> | null
    /**
     * Filter, which BacklogItem to fetch.
     */
    where: BacklogItemWhereUniqueInput
  }

  /**
   * BacklogItem findFirst
   */
  export type BacklogItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemInclude<ExtArgs> | null
    /**
     * Filter, which BacklogItem to fetch.
     */
    where?: BacklogItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BacklogItems to fetch.
     */
    orderBy?: BacklogItemOrderByWithRelationInput | BacklogItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BacklogItems.
     */
    cursor?: BacklogItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BacklogItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BacklogItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BacklogItems.
     */
    distinct?: BacklogItemScalarFieldEnum | BacklogItemScalarFieldEnum[]
  }

  /**
   * BacklogItem findFirstOrThrow
   */
  export type BacklogItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemInclude<ExtArgs> | null
    /**
     * Filter, which BacklogItem to fetch.
     */
    where?: BacklogItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BacklogItems to fetch.
     */
    orderBy?: BacklogItemOrderByWithRelationInput | BacklogItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BacklogItems.
     */
    cursor?: BacklogItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BacklogItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BacklogItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BacklogItems.
     */
    distinct?: BacklogItemScalarFieldEnum | BacklogItemScalarFieldEnum[]
  }

  /**
   * BacklogItem findMany
   */
  export type BacklogItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemInclude<ExtArgs> | null
    /**
     * Filter, which BacklogItems to fetch.
     */
    where?: BacklogItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BacklogItems to fetch.
     */
    orderBy?: BacklogItemOrderByWithRelationInput | BacklogItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BacklogItems.
     */
    cursor?: BacklogItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BacklogItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BacklogItems.
     */
    skip?: number
    distinct?: BacklogItemScalarFieldEnum | BacklogItemScalarFieldEnum[]
  }

  /**
   * BacklogItem create
   */
  export type BacklogItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemInclude<ExtArgs> | null
    /**
     * The data needed to create a BacklogItem.
     */
    data: XOR<BacklogItemCreateInput, BacklogItemUncheckedCreateInput>
  }

  /**
   * BacklogItem createMany
   */
  export type BacklogItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BacklogItems.
     */
    data: BacklogItemCreateManyInput | BacklogItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BacklogItem createManyAndReturn
   */
  export type BacklogItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many BacklogItems.
     */
    data: BacklogItemCreateManyInput | BacklogItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * BacklogItem update
   */
  export type BacklogItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemInclude<ExtArgs> | null
    /**
     * The data needed to update a BacklogItem.
     */
    data: XOR<BacklogItemUpdateInput, BacklogItemUncheckedUpdateInput>
    /**
     * Choose, which BacklogItem to update.
     */
    where: BacklogItemWhereUniqueInput
  }

  /**
   * BacklogItem updateMany
   */
  export type BacklogItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BacklogItems.
     */
    data: XOR<BacklogItemUpdateManyMutationInput, BacklogItemUncheckedUpdateManyInput>
    /**
     * Filter which BacklogItems to update
     */
    where?: BacklogItemWhereInput
  }

  /**
   * BacklogItem upsert
   */
  export type BacklogItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemInclude<ExtArgs> | null
    /**
     * The filter to search for the BacklogItem to update in case it exists.
     */
    where: BacklogItemWhereUniqueInput
    /**
     * In case the BacklogItem found by the `where` argument doesn't exist, create a new BacklogItem with this data.
     */
    create: XOR<BacklogItemCreateInput, BacklogItemUncheckedCreateInput>
    /**
     * In case the BacklogItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BacklogItemUpdateInput, BacklogItemUncheckedUpdateInput>
  }

  /**
   * BacklogItem delete
   */
  export type BacklogItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemInclude<ExtArgs> | null
    /**
     * Filter which BacklogItem to delete.
     */
    where: BacklogItemWhereUniqueInput
  }

  /**
   * BacklogItem deleteMany
   */
  export type BacklogItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BacklogItems to delete
     */
    where?: BacklogItemWhereInput
  }

  /**
   * BacklogItem.version
   */
  export type BacklogItem$versionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionReleaseInclude<ExtArgs> | null
    where?: VersionReleaseWhereInput
  }

  /**
   * BacklogItem.comments
   */
  export type BacklogItem$commentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentInclude<ExtArgs> | null
    where?: BacklogCommentWhereInput
    orderBy?: BacklogCommentOrderByWithRelationInput | BacklogCommentOrderByWithRelationInput[]
    cursor?: BacklogCommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BacklogCommentScalarFieldEnum | BacklogCommentScalarFieldEnum[]
  }

  /**
   * BacklogItem without action
   */
  export type BacklogItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemInclude<ExtArgs> | null
  }


  /**
   * Model BacklogComment
   */

  export type AggregateBacklogComment = {
    _count: BacklogCommentCountAggregateOutputType | null
    _avg: BacklogCommentAvgAggregateOutputType | null
    _sum: BacklogCommentSumAggregateOutputType | null
    _min: BacklogCommentMinAggregateOutputType | null
    _max: BacklogCommentMaxAggregateOutputType | null
  }

  export type BacklogCommentAvgAggregateOutputType = {
    id: number | null
    backlogItemId: number | null
  }

  export type BacklogCommentSumAggregateOutputType = {
    id: number | null
    backlogItemId: number | null
  }

  export type BacklogCommentMinAggregateOutputType = {
    id: number | null
    backlogItemId: number | null
    content: string | null
    author: string | null
    created_at: Date | null
  }

  export type BacklogCommentMaxAggregateOutputType = {
    id: number | null
    backlogItemId: number | null
    content: string | null
    author: string | null
    created_at: Date | null
  }

  export type BacklogCommentCountAggregateOutputType = {
    id: number
    backlogItemId: number
    content: number
    author: number
    created_at: number
    _all: number
  }


  export type BacklogCommentAvgAggregateInputType = {
    id?: true
    backlogItemId?: true
  }

  export type BacklogCommentSumAggregateInputType = {
    id?: true
    backlogItemId?: true
  }

  export type BacklogCommentMinAggregateInputType = {
    id?: true
    backlogItemId?: true
    content?: true
    author?: true
    created_at?: true
  }

  export type BacklogCommentMaxAggregateInputType = {
    id?: true
    backlogItemId?: true
    content?: true
    author?: true
    created_at?: true
  }

  export type BacklogCommentCountAggregateInputType = {
    id?: true
    backlogItemId?: true
    content?: true
    author?: true
    created_at?: true
    _all?: true
  }

  export type BacklogCommentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BacklogComment to aggregate.
     */
    where?: BacklogCommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BacklogComments to fetch.
     */
    orderBy?: BacklogCommentOrderByWithRelationInput | BacklogCommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BacklogCommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BacklogComments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BacklogComments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BacklogComments
    **/
    _count?: true | BacklogCommentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BacklogCommentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BacklogCommentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BacklogCommentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BacklogCommentMaxAggregateInputType
  }

  export type GetBacklogCommentAggregateType<T extends BacklogCommentAggregateArgs> = {
        [P in keyof T & keyof AggregateBacklogComment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBacklogComment[P]>
      : GetScalarType<T[P], AggregateBacklogComment[P]>
  }




  export type BacklogCommentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BacklogCommentWhereInput
    orderBy?: BacklogCommentOrderByWithAggregationInput | BacklogCommentOrderByWithAggregationInput[]
    by: BacklogCommentScalarFieldEnum[] | BacklogCommentScalarFieldEnum
    having?: BacklogCommentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BacklogCommentCountAggregateInputType | true
    _avg?: BacklogCommentAvgAggregateInputType
    _sum?: BacklogCommentSumAggregateInputType
    _min?: BacklogCommentMinAggregateInputType
    _max?: BacklogCommentMaxAggregateInputType
  }

  export type BacklogCommentGroupByOutputType = {
    id: number
    backlogItemId: number
    content: string
    author: string | null
    created_at: Date
    _count: BacklogCommentCountAggregateOutputType | null
    _avg: BacklogCommentAvgAggregateOutputType | null
    _sum: BacklogCommentSumAggregateOutputType | null
    _min: BacklogCommentMinAggregateOutputType | null
    _max: BacklogCommentMaxAggregateOutputType | null
  }

  type GetBacklogCommentGroupByPayload<T extends BacklogCommentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BacklogCommentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BacklogCommentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BacklogCommentGroupByOutputType[P]>
            : GetScalarType<T[P], BacklogCommentGroupByOutputType[P]>
        }
      >
    >


  export type BacklogCommentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    backlogItemId?: boolean
    content?: boolean
    author?: boolean
    created_at?: boolean
    backlogItem?: boolean | BacklogItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["backlogComment"]>

  export type BacklogCommentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    backlogItemId?: boolean
    content?: boolean
    author?: boolean
    created_at?: boolean
    backlogItem?: boolean | BacklogItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["backlogComment"]>

  export type BacklogCommentSelectScalar = {
    id?: boolean
    backlogItemId?: boolean
    content?: boolean
    author?: boolean
    created_at?: boolean
  }

  export type BacklogCommentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    backlogItem?: boolean | BacklogItemDefaultArgs<ExtArgs>
  }
  export type BacklogCommentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    backlogItem?: boolean | BacklogItemDefaultArgs<ExtArgs>
  }

  export type $BacklogCommentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BacklogComment"
    objects: {
      backlogItem: Prisma.$BacklogItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      backlogItemId: number
      content: string
      author: string | null
      created_at: Date
    }, ExtArgs["result"]["backlogComment"]>
    composites: {}
  }

  type BacklogCommentGetPayload<S extends boolean | null | undefined | BacklogCommentDefaultArgs> = $Result.GetResult<Prisma.$BacklogCommentPayload, S>

  type BacklogCommentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<BacklogCommentFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: BacklogCommentCountAggregateInputType | true
    }

  export interface BacklogCommentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BacklogComment'], meta: { name: 'BacklogComment' } }
    /**
     * Find zero or one BacklogComment that matches the filter.
     * @param {BacklogCommentFindUniqueArgs} args - Arguments to find a BacklogComment
     * @example
     * // Get one BacklogComment
     * const backlogComment = await prisma.backlogComment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BacklogCommentFindUniqueArgs>(args: SelectSubset<T, BacklogCommentFindUniqueArgs<ExtArgs>>): Prisma__BacklogCommentClient<$Result.GetResult<Prisma.$BacklogCommentPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one BacklogComment that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {BacklogCommentFindUniqueOrThrowArgs} args - Arguments to find a BacklogComment
     * @example
     * // Get one BacklogComment
     * const backlogComment = await prisma.backlogComment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BacklogCommentFindUniqueOrThrowArgs>(args: SelectSubset<T, BacklogCommentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BacklogCommentClient<$Result.GetResult<Prisma.$BacklogCommentPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first BacklogComment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogCommentFindFirstArgs} args - Arguments to find a BacklogComment
     * @example
     * // Get one BacklogComment
     * const backlogComment = await prisma.backlogComment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BacklogCommentFindFirstArgs>(args?: SelectSubset<T, BacklogCommentFindFirstArgs<ExtArgs>>): Prisma__BacklogCommentClient<$Result.GetResult<Prisma.$BacklogCommentPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first BacklogComment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogCommentFindFirstOrThrowArgs} args - Arguments to find a BacklogComment
     * @example
     * // Get one BacklogComment
     * const backlogComment = await prisma.backlogComment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BacklogCommentFindFirstOrThrowArgs>(args?: SelectSubset<T, BacklogCommentFindFirstOrThrowArgs<ExtArgs>>): Prisma__BacklogCommentClient<$Result.GetResult<Prisma.$BacklogCommentPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more BacklogComments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogCommentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BacklogComments
     * const backlogComments = await prisma.backlogComment.findMany()
     * 
     * // Get first 10 BacklogComments
     * const backlogComments = await prisma.backlogComment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const backlogCommentWithIdOnly = await prisma.backlogComment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BacklogCommentFindManyArgs>(args?: SelectSubset<T, BacklogCommentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BacklogCommentPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a BacklogComment.
     * @param {BacklogCommentCreateArgs} args - Arguments to create a BacklogComment.
     * @example
     * // Create one BacklogComment
     * const BacklogComment = await prisma.backlogComment.create({
     *   data: {
     *     // ... data to create a BacklogComment
     *   }
     * })
     * 
     */
    create<T extends BacklogCommentCreateArgs>(args: SelectSubset<T, BacklogCommentCreateArgs<ExtArgs>>): Prisma__BacklogCommentClient<$Result.GetResult<Prisma.$BacklogCommentPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many BacklogComments.
     * @param {BacklogCommentCreateManyArgs} args - Arguments to create many BacklogComments.
     * @example
     * // Create many BacklogComments
     * const backlogComment = await prisma.backlogComment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BacklogCommentCreateManyArgs>(args?: SelectSubset<T, BacklogCommentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BacklogComments and returns the data saved in the database.
     * @param {BacklogCommentCreateManyAndReturnArgs} args - Arguments to create many BacklogComments.
     * @example
     * // Create many BacklogComments
     * const backlogComment = await prisma.backlogComment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BacklogComments and only return the `id`
     * const backlogCommentWithIdOnly = await prisma.backlogComment.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BacklogCommentCreateManyAndReturnArgs>(args?: SelectSubset<T, BacklogCommentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BacklogCommentPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a BacklogComment.
     * @param {BacklogCommentDeleteArgs} args - Arguments to delete one BacklogComment.
     * @example
     * // Delete one BacklogComment
     * const BacklogComment = await prisma.backlogComment.delete({
     *   where: {
     *     // ... filter to delete one BacklogComment
     *   }
     * })
     * 
     */
    delete<T extends BacklogCommentDeleteArgs>(args: SelectSubset<T, BacklogCommentDeleteArgs<ExtArgs>>): Prisma__BacklogCommentClient<$Result.GetResult<Prisma.$BacklogCommentPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one BacklogComment.
     * @param {BacklogCommentUpdateArgs} args - Arguments to update one BacklogComment.
     * @example
     * // Update one BacklogComment
     * const backlogComment = await prisma.backlogComment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BacklogCommentUpdateArgs>(args: SelectSubset<T, BacklogCommentUpdateArgs<ExtArgs>>): Prisma__BacklogCommentClient<$Result.GetResult<Prisma.$BacklogCommentPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more BacklogComments.
     * @param {BacklogCommentDeleteManyArgs} args - Arguments to filter BacklogComments to delete.
     * @example
     * // Delete a few BacklogComments
     * const { count } = await prisma.backlogComment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BacklogCommentDeleteManyArgs>(args?: SelectSubset<T, BacklogCommentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BacklogComments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogCommentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BacklogComments
     * const backlogComment = await prisma.backlogComment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BacklogCommentUpdateManyArgs>(args: SelectSubset<T, BacklogCommentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one BacklogComment.
     * @param {BacklogCommentUpsertArgs} args - Arguments to update or create a BacklogComment.
     * @example
     * // Update or create a BacklogComment
     * const backlogComment = await prisma.backlogComment.upsert({
     *   create: {
     *     // ... data to create a BacklogComment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BacklogComment we want to update
     *   }
     * })
     */
    upsert<T extends BacklogCommentUpsertArgs>(args: SelectSubset<T, BacklogCommentUpsertArgs<ExtArgs>>): Prisma__BacklogCommentClient<$Result.GetResult<Prisma.$BacklogCommentPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of BacklogComments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogCommentCountArgs} args - Arguments to filter BacklogComments to count.
     * @example
     * // Count the number of BacklogComments
     * const count = await prisma.backlogComment.count({
     *   where: {
     *     // ... the filter for the BacklogComments we want to count
     *   }
     * })
    **/
    count<T extends BacklogCommentCountArgs>(
      args?: Subset<T, BacklogCommentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BacklogCommentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BacklogComment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogCommentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BacklogCommentAggregateArgs>(args: Subset<T, BacklogCommentAggregateArgs>): Prisma.PrismaPromise<GetBacklogCommentAggregateType<T>>

    /**
     * Group by BacklogComment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BacklogCommentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BacklogCommentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BacklogCommentGroupByArgs['orderBy'] }
        : { orderBy?: BacklogCommentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BacklogCommentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBacklogCommentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BacklogComment model
   */
  readonly fields: BacklogCommentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BacklogComment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BacklogCommentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    backlogItem<T extends BacklogItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BacklogItemDefaultArgs<ExtArgs>>): Prisma__BacklogItemClient<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BacklogComment model
   */ 
  interface BacklogCommentFieldRefs {
    readonly id: FieldRef<"BacklogComment", 'Int'>
    readonly backlogItemId: FieldRef<"BacklogComment", 'Int'>
    readonly content: FieldRef<"BacklogComment", 'String'>
    readonly author: FieldRef<"BacklogComment", 'String'>
    readonly created_at: FieldRef<"BacklogComment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BacklogComment findUnique
   */
  export type BacklogCommentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentInclude<ExtArgs> | null
    /**
     * Filter, which BacklogComment to fetch.
     */
    where: BacklogCommentWhereUniqueInput
  }

  /**
   * BacklogComment findUniqueOrThrow
   */
  export type BacklogCommentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentInclude<ExtArgs> | null
    /**
     * Filter, which BacklogComment to fetch.
     */
    where: BacklogCommentWhereUniqueInput
  }

  /**
   * BacklogComment findFirst
   */
  export type BacklogCommentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentInclude<ExtArgs> | null
    /**
     * Filter, which BacklogComment to fetch.
     */
    where?: BacklogCommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BacklogComments to fetch.
     */
    orderBy?: BacklogCommentOrderByWithRelationInput | BacklogCommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BacklogComments.
     */
    cursor?: BacklogCommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BacklogComments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BacklogComments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BacklogComments.
     */
    distinct?: BacklogCommentScalarFieldEnum | BacklogCommentScalarFieldEnum[]
  }

  /**
   * BacklogComment findFirstOrThrow
   */
  export type BacklogCommentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentInclude<ExtArgs> | null
    /**
     * Filter, which BacklogComment to fetch.
     */
    where?: BacklogCommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BacklogComments to fetch.
     */
    orderBy?: BacklogCommentOrderByWithRelationInput | BacklogCommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BacklogComments.
     */
    cursor?: BacklogCommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BacklogComments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BacklogComments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BacklogComments.
     */
    distinct?: BacklogCommentScalarFieldEnum | BacklogCommentScalarFieldEnum[]
  }

  /**
   * BacklogComment findMany
   */
  export type BacklogCommentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentInclude<ExtArgs> | null
    /**
     * Filter, which BacklogComments to fetch.
     */
    where?: BacklogCommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BacklogComments to fetch.
     */
    orderBy?: BacklogCommentOrderByWithRelationInput | BacklogCommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BacklogComments.
     */
    cursor?: BacklogCommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BacklogComments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BacklogComments.
     */
    skip?: number
    distinct?: BacklogCommentScalarFieldEnum | BacklogCommentScalarFieldEnum[]
  }

  /**
   * BacklogComment create
   */
  export type BacklogCommentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentInclude<ExtArgs> | null
    /**
     * The data needed to create a BacklogComment.
     */
    data: XOR<BacklogCommentCreateInput, BacklogCommentUncheckedCreateInput>
  }

  /**
   * BacklogComment createMany
   */
  export type BacklogCommentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BacklogComments.
     */
    data: BacklogCommentCreateManyInput | BacklogCommentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BacklogComment createManyAndReturn
   */
  export type BacklogCommentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many BacklogComments.
     */
    data: BacklogCommentCreateManyInput | BacklogCommentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * BacklogComment update
   */
  export type BacklogCommentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentInclude<ExtArgs> | null
    /**
     * The data needed to update a BacklogComment.
     */
    data: XOR<BacklogCommentUpdateInput, BacklogCommentUncheckedUpdateInput>
    /**
     * Choose, which BacklogComment to update.
     */
    where: BacklogCommentWhereUniqueInput
  }

  /**
   * BacklogComment updateMany
   */
  export type BacklogCommentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BacklogComments.
     */
    data: XOR<BacklogCommentUpdateManyMutationInput, BacklogCommentUncheckedUpdateManyInput>
    /**
     * Filter which BacklogComments to update
     */
    where?: BacklogCommentWhereInput
  }

  /**
   * BacklogComment upsert
   */
  export type BacklogCommentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentInclude<ExtArgs> | null
    /**
     * The filter to search for the BacklogComment to update in case it exists.
     */
    where: BacklogCommentWhereUniqueInput
    /**
     * In case the BacklogComment found by the `where` argument doesn't exist, create a new BacklogComment with this data.
     */
    create: XOR<BacklogCommentCreateInput, BacklogCommentUncheckedCreateInput>
    /**
     * In case the BacklogComment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BacklogCommentUpdateInput, BacklogCommentUncheckedUpdateInput>
  }

  /**
   * BacklogComment delete
   */
  export type BacklogCommentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentInclude<ExtArgs> | null
    /**
     * Filter which BacklogComment to delete.
     */
    where: BacklogCommentWhereUniqueInput
  }

  /**
   * BacklogComment deleteMany
   */
  export type BacklogCommentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BacklogComments to delete
     */
    where?: BacklogCommentWhereInput
  }

  /**
   * BacklogComment without action
   */
  export type BacklogCommentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogComment
     */
    select?: BacklogCommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogCommentInclude<ExtArgs> | null
  }


  /**
   * Model VersionRelease
   */

  export type AggregateVersionRelease = {
    _count: VersionReleaseCountAggregateOutputType | null
    _avg: VersionReleaseAvgAggregateOutputType | null
    _sum: VersionReleaseSumAggregateOutputType | null
    _min: VersionReleaseMinAggregateOutputType | null
    _max: VersionReleaseMaxAggregateOutputType | null
  }

  export type VersionReleaseAvgAggregateOutputType = {
    id: number | null
  }

  export type VersionReleaseSumAggregateOutputType = {
    id: number | null
  }

  export type VersionReleaseMinAggregateOutputType = {
    id: number | null
    versionNumber: string | null
    notes: string | null
    releasedAt: Date | null
    created_at: Date | null
  }

  export type VersionReleaseMaxAggregateOutputType = {
    id: number | null
    versionNumber: string | null
    notes: string | null
    releasedAt: Date | null
    created_at: Date | null
  }

  export type VersionReleaseCountAggregateOutputType = {
    id: number
    versionNumber: number
    notes: number
    releasedAt: number
    created_at: number
    _all: number
  }


  export type VersionReleaseAvgAggregateInputType = {
    id?: true
  }

  export type VersionReleaseSumAggregateInputType = {
    id?: true
  }

  export type VersionReleaseMinAggregateInputType = {
    id?: true
    versionNumber?: true
    notes?: true
    releasedAt?: true
    created_at?: true
  }

  export type VersionReleaseMaxAggregateInputType = {
    id?: true
    versionNumber?: true
    notes?: true
    releasedAt?: true
    created_at?: true
  }

  export type VersionReleaseCountAggregateInputType = {
    id?: true
    versionNumber?: true
    notes?: true
    releasedAt?: true
    created_at?: true
    _all?: true
  }

  export type VersionReleaseAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VersionRelease to aggregate.
     */
    where?: VersionReleaseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VersionReleases to fetch.
     */
    orderBy?: VersionReleaseOrderByWithRelationInput | VersionReleaseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VersionReleaseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VersionReleases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VersionReleases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VersionReleases
    **/
    _count?: true | VersionReleaseCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: VersionReleaseAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: VersionReleaseSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VersionReleaseMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VersionReleaseMaxAggregateInputType
  }

  export type GetVersionReleaseAggregateType<T extends VersionReleaseAggregateArgs> = {
        [P in keyof T & keyof AggregateVersionRelease]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVersionRelease[P]>
      : GetScalarType<T[P], AggregateVersionRelease[P]>
  }




  export type VersionReleaseGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VersionReleaseWhereInput
    orderBy?: VersionReleaseOrderByWithAggregationInput | VersionReleaseOrderByWithAggregationInput[]
    by: VersionReleaseScalarFieldEnum[] | VersionReleaseScalarFieldEnum
    having?: VersionReleaseScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VersionReleaseCountAggregateInputType | true
    _avg?: VersionReleaseAvgAggregateInputType
    _sum?: VersionReleaseSumAggregateInputType
    _min?: VersionReleaseMinAggregateInputType
    _max?: VersionReleaseMaxAggregateInputType
  }

  export type VersionReleaseGroupByOutputType = {
    id: number
    versionNumber: string
    notes: string | null
    releasedAt: Date
    created_at: Date
    _count: VersionReleaseCountAggregateOutputType | null
    _avg: VersionReleaseAvgAggregateOutputType | null
    _sum: VersionReleaseSumAggregateOutputType | null
    _min: VersionReleaseMinAggregateOutputType | null
    _max: VersionReleaseMaxAggregateOutputType | null
  }

  type GetVersionReleaseGroupByPayload<T extends VersionReleaseGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VersionReleaseGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VersionReleaseGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VersionReleaseGroupByOutputType[P]>
            : GetScalarType<T[P], VersionReleaseGroupByOutputType[P]>
        }
      >
    >


  export type VersionReleaseSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    versionNumber?: boolean
    notes?: boolean
    releasedAt?: boolean
    created_at?: boolean
    backlogItems?: boolean | VersionRelease$backlogItemsArgs<ExtArgs>
    _count?: boolean | VersionReleaseCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["versionRelease"]>

  export type VersionReleaseSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    versionNumber?: boolean
    notes?: boolean
    releasedAt?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["versionRelease"]>

  export type VersionReleaseSelectScalar = {
    id?: boolean
    versionNumber?: boolean
    notes?: boolean
    releasedAt?: boolean
    created_at?: boolean
  }

  export type VersionReleaseInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    backlogItems?: boolean | VersionRelease$backlogItemsArgs<ExtArgs>
    _count?: boolean | VersionReleaseCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type VersionReleaseIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $VersionReleasePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VersionRelease"
    objects: {
      backlogItems: Prisma.$BacklogItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      versionNumber: string
      notes: string | null
      releasedAt: Date
      created_at: Date
    }, ExtArgs["result"]["versionRelease"]>
    composites: {}
  }

  type VersionReleaseGetPayload<S extends boolean | null | undefined | VersionReleaseDefaultArgs> = $Result.GetResult<Prisma.$VersionReleasePayload, S>

  type VersionReleaseCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<VersionReleaseFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: VersionReleaseCountAggregateInputType | true
    }

  export interface VersionReleaseDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VersionRelease'], meta: { name: 'VersionRelease' } }
    /**
     * Find zero or one VersionRelease that matches the filter.
     * @param {VersionReleaseFindUniqueArgs} args - Arguments to find a VersionRelease
     * @example
     * // Get one VersionRelease
     * const versionRelease = await prisma.versionRelease.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VersionReleaseFindUniqueArgs>(args: SelectSubset<T, VersionReleaseFindUniqueArgs<ExtArgs>>): Prisma__VersionReleaseClient<$Result.GetResult<Prisma.$VersionReleasePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one VersionRelease that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {VersionReleaseFindUniqueOrThrowArgs} args - Arguments to find a VersionRelease
     * @example
     * // Get one VersionRelease
     * const versionRelease = await prisma.versionRelease.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VersionReleaseFindUniqueOrThrowArgs>(args: SelectSubset<T, VersionReleaseFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VersionReleaseClient<$Result.GetResult<Prisma.$VersionReleasePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first VersionRelease that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionReleaseFindFirstArgs} args - Arguments to find a VersionRelease
     * @example
     * // Get one VersionRelease
     * const versionRelease = await prisma.versionRelease.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VersionReleaseFindFirstArgs>(args?: SelectSubset<T, VersionReleaseFindFirstArgs<ExtArgs>>): Prisma__VersionReleaseClient<$Result.GetResult<Prisma.$VersionReleasePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first VersionRelease that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionReleaseFindFirstOrThrowArgs} args - Arguments to find a VersionRelease
     * @example
     * // Get one VersionRelease
     * const versionRelease = await prisma.versionRelease.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VersionReleaseFindFirstOrThrowArgs>(args?: SelectSubset<T, VersionReleaseFindFirstOrThrowArgs<ExtArgs>>): Prisma__VersionReleaseClient<$Result.GetResult<Prisma.$VersionReleasePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more VersionReleases that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionReleaseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VersionReleases
     * const versionReleases = await prisma.versionRelease.findMany()
     * 
     * // Get first 10 VersionReleases
     * const versionReleases = await prisma.versionRelease.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const versionReleaseWithIdOnly = await prisma.versionRelease.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VersionReleaseFindManyArgs>(args?: SelectSubset<T, VersionReleaseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VersionReleasePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a VersionRelease.
     * @param {VersionReleaseCreateArgs} args - Arguments to create a VersionRelease.
     * @example
     * // Create one VersionRelease
     * const VersionRelease = await prisma.versionRelease.create({
     *   data: {
     *     // ... data to create a VersionRelease
     *   }
     * })
     * 
     */
    create<T extends VersionReleaseCreateArgs>(args: SelectSubset<T, VersionReleaseCreateArgs<ExtArgs>>): Prisma__VersionReleaseClient<$Result.GetResult<Prisma.$VersionReleasePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many VersionReleases.
     * @param {VersionReleaseCreateManyArgs} args - Arguments to create many VersionReleases.
     * @example
     * // Create many VersionReleases
     * const versionRelease = await prisma.versionRelease.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VersionReleaseCreateManyArgs>(args?: SelectSubset<T, VersionReleaseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VersionReleases and returns the data saved in the database.
     * @param {VersionReleaseCreateManyAndReturnArgs} args - Arguments to create many VersionReleases.
     * @example
     * // Create many VersionReleases
     * const versionRelease = await prisma.versionRelease.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VersionReleases and only return the `id`
     * const versionReleaseWithIdOnly = await prisma.versionRelease.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VersionReleaseCreateManyAndReturnArgs>(args?: SelectSubset<T, VersionReleaseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VersionReleasePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a VersionRelease.
     * @param {VersionReleaseDeleteArgs} args - Arguments to delete one VersionRelease.
     * @example
     * // Delete one VersionRelease
     * const VersionRelease = await prisma.versionRelease.delete({
     *   where: {
     *     // ... filter to delete one VersionRelease
     *   }
     * })
     * 
     */
    delete<T extends VersionReleaseDeleteArgs>(args: SelectSubset<T, VersionReleaseDeleteArgs<ExtArgs>>): Prisma__VersionReleaseClient<$Result.GetResult<Prisma.$VersionReleasePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one VersionRelease.
     * @param {VersionReleaseUpdateArgs} args - Arguments to update one VersionRelease.
     * @example
     * // Update one VersionRelease
     * const versionRelease = await prisma.versionRelease.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VersionReleaseUpdateArgs>(args: SelectSubset<T, VersionReleaseUpdateArgs<ExtArgs>>): Prisma__VersionReleaseClient<$Result.GetResult<Prisma.$VersionReleasePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more VersionReleases.
     * @param {VersionReleaseDeleteManyArgs} args - Arguments to filter VersionReleases to delete.
     * @example
     * // Delete a few VersionReleases
     * const { count } = await prisma.versionRelease.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VersionReleaseDeleteManyArgs>(args?: SelectSubset<T, VersionReleaseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VersionReleases.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionReleaseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VersionReleases
     * const versionRelease = await prisma.versionRelease.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VersionReleaseUpdateManyArgs>(args: SelectSubset<T, VersionReleaseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one VersionRelease.
     * @param {VersionReleaseUpsertArgs} args - Arguments to update or create a VersionRelease.
     * @example
     * // Update or create a VersionRelease
     * const versionRelease = await prisma.versionRelease.upsert({
     *   create: {
     *     // ... data to create a VersionRelease
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VersionRelease we want to update
     *   }
     * })
     */
    upsert<T extends VersionReleaseUpsertArgs>(args: SelectSubset<T, VersionReleaseUpsertArgs<ExtArgs>>): Prisma__VersionReleaseClient<$Result.GetResult<Prisma.$VersionReleasePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of VersionReleases.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionReleaseCountArgs} args - Arguments to filter VersionReleases to count.
     * @example
     * // Count the number of VersionReleases
     * const count = await prisma.versionRelease.count({
     *   where: {
     *     // ... the filter for the VersionReleases we want to count
     *   }
     * })
    **/
    count<T extends VersionReleaseCountArgs>(
      args?: Subset<T, VersionReleaseCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VersionReleaseCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VersionRelease.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionReleaseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VersionReleaseAggregateArgs>(args: Subset<T, VersionReleaseAggregateArgs>): Prisma.PrismaPromise<GetVersionReleaseAggregateType<T>>

    /**
     * Group by VersionRelease.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionReleaseGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VersionReleaseGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VersionReleaseGroupByArgs['orderBy'] }
        : { orderBy?: VersionReleaseGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VersionReleaseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVersionReleaseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VersionRelease model
   */
  readonly fields: VersionReleaseFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VersionRelease.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VersionReleaseClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    backlogItems<T extends VersionRelease$backlogItemsArgs<ExtArgs> = {}>(args?: Subset<T, VersionRelease$backlogItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BacklogItemPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VersionRelease model
   */ 
  interface VersionReleaseFieldRefs {
    readonly id: FieldRef<"VersionRelease", 'Int'>
    readonly versionNumber: FieldRef<"VersionRelease", 'String'>
    readonly notes: FieldRef<"VersionRelease", 'String'>
    readonly releasedAt: FieldRef<"VersionRelease", 'DateTime'>
    readonly created_at: FieldRef<"VersionRelease", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * VersionRelease findUnique
   */
  export type VersionReleaseFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionReleaseInclude<ExtArgs> | null
    /**
     * Filter, which VersionRelease to fetch.
     */
    where: VersionReleaseWhereUniqueInput
  }

  /**
   * VersionRelease findUniqueOrThrow
   */
  export type VersionReleaseFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionReleaseInclude<ExtArgs> | null
    /**
     * Filter, which VersionRelease to fetch.
     */
    where: VersionReleaseWhereUniqueInput
  }

  /**
   * VersionRelease findFirst
   */
  export type VersionReleaseFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionReleaseInclude<ExtArgs> | null
    /**
     * Filter, which VersionRelease to fetch.
     */
    where?: VersionReleaseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VersionReleases to fetch.
     */
    orderBy?: VersionReleaseOrderByWithRelationInput | VersionReleaseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VersionReleases.
     */
    cursor?: VersionReleaseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VersionReleases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VersionReleases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VersionReleases.
     */
    distinct?: VersionReleaseScalarFieldEnum | VersionReleaseScalarFieldEnum[]
  }

  /**
   * VersionRelease findFirstOrThrow
   */
  export type VersionReleaseFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionReleaseInclude<ExtArgs> | null
    /**
     * Filter, which VersionRelease to fetch.
     */
    where?: VersionReleaseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VersionReleases to fetch.
     */
    orderBy?: VersionReleaseOrderByWithRelationInput | VersionReleaseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VersionReleases.
     */
    cursor?: VersionReleaseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VersionReleases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VersionReleases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VersionReleases.
     */
    distinct?: VersionReleaseScalarFieldEnum | VersionReleaseScalarFieldEnum[]
  }

  /**
   * VersionRelease findMany
   */
  export type VersionReleaseFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionReleaseInclude<ExtArgs> | null
    /**
     * Filter, which VersionReleases to fetch.
     */
    where?: VersionReleaseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VersionReleases to fetch.
     */
    orderBy?: VersionReleaseOrderByWithRelationInput | VersionReleaseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VersionReleases.
     */
    cursor?: VersionReleaseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VersionReleases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VersionReleases.
     */
    skip?: number
    distinct?: VersionReleaseScalarFieldEnum | VersionReleaseScalarFieldEnum[]
  }

  /**
   * VersionRelease create
   */
  export type VersionReleaseCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionReleaseInclude<ExtArgs> | null
    /**
     * The data needed to create a VersionRelease.
     */
    data: XOR<VersionReleaseCreateInput, VersionReleaseUncheckedCreateInput>
  }

  /**
   * VersionRelease createMany
   */
  export type VersionReleaseCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VersionReleases.
     */
    data: VersionReleaseCreateManyInput | VersionReleaseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VersionRelease createManyAndReturn
   */
  export type VersionReleaseCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many VersionReleases.
     */
    data: VersionReleaseCreateManyInput | VersionReleaseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VersionRelease update
   */
  export type VersionReleaseUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionReleaseInclude<ExtArgs> | null
    /**
     * The data needed to update a VersionRelease.
     */
    data: XOR<VersionReleaseUpdateInput, VersionReleaseUncheckedUpdateInput>
    /**
     * Choose, which VersionRelease to update.
     */
    where: VersionReleaseWhereUniqueInput
  }

  /**
   * VersionRelease updateMany
   */
  export type VersionReleaseUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VersionReleases.
     */
    data: XOR<VersionReleaseUpdateManyMutationInput, VersionReleaseUncheckedUpdateManyInput>
    /**
     * Filter which VersionReleases to update
     */
    where?: VersionReleaseWhereInput
  }

  /**
   * VersionRelease upsert
   */
  export type VersionReleaseUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionReleaseInclude<ExtArgs> | null
    /**
     * The filter to search for the VersionRelease to update in case it exists.
     */
    where: VersionReleaseWhereUniqueInput
    /**
     * In case the VersionRelease found by the `where` argument doesn't exist, create a new VersionRelease with this data.
     */
    create: XOR<VersionReleaseCreateInput, VersionReleaseUncheckedCreateInput>
    /**
     * In case the VersionRelease was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VersionReleaseUpdateInput, VersionReleaseUncheckedUpdateInput>
  }

  /**
   * VersionRelease delete
   */
  export type VersionReleaseDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionReleaseInclude<ExtArgs> | null
    /**
     * Filter which VersionRelease to delete.
     */
    where: VersionReleaseWhereUniqueInput
  }

  /**
   * VersionRelease deleteMany
   */
  export type VersionReleaseDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VersionReleases to delete
     */
    where?: VersionReleaseWhereInput
  }

  /**
   * VersionRelease.backlogItems
   */
  export type VersionRelease$backlogItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BacklogItem
     */
    select?: BacklogItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BacklogItemInclude<ExtArgs> | null
    where?: BacklogItemWhereInput
    orderBy?: BacklogItemOrderByWithRelationInput | BacklogItemOrderByWithRelationInput[]
    cursor?: BacklogItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BacklogItemScalarFieldEnum | BacklogItemScalarFieldEnum[]
  }

  /**
   * VersionRelease without action
   */
  export type VersionReleaseDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionRelease
     */
    select?: VersionReleaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionReleaseInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const BacklogItemScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    type: 'type',
    priority: 'priority',
    status: 'status',
    versionId: 'versionId',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type BacklogItemScalarFieldEnum = (typeof BacklogItemScalarFieldEnum)[keyof typeof BacklogItemScalarFieldEnum]


  export const BacklogCommentScalarFieldEnum: {
    id: 'id',
    backlogItemId: 'backlogItemId',
    content: 'content',
    author: 'author',
    created_at: 'created_at'
  };

  export type BacklogCommentScalarFieldEnum = (typeof BacklogCommentScalarFieldEnum)[keyof typeof BacklogCommentScalarFieldEnum]


  export const VersionReleaseScalarFieldEnum: {
    id: 'id',
    versionNumber: 'versionNumber',
    notes: 'notes',
    releasedAt: 'releasedAt',
    created_at: 'created_at'
  };

  export type VersionReleaseScalarFieldEnum = (typeof VersionReleaseScalarFieldEnum)[keyof typeof VersionReleaseScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type BacklogItemWhereInput = {
    AND?: BacklogItemWhereInput | BacklogItemWhereInput[]
    OR?: BacklogItemWhereInput[]
    NOT?: BacklogItemWhereInput | BacklogItemWhereInput[]
    id?: IntFilter<"BacklogItem"> | number
    title?: StringFilter<"BacklogItem"> | string
    description?: StringNullableFilter<"BacklogItem"> | string | null
    type?: StringFilter<"BacklogItem"> | string
    priority?: StringFilter<"BacklogItem"> | string
    status?: StringFilter<"BacklogItem"> | string
    versionId?: IntNullableFilter<"BacklogItem"> | number | null
    created_at?: DateTimeFilter<"BacklogItem"> | Date | string
    updated_at?: DateTimeFilter<"BacklogItem"> | Date | string
    version?: XOR<VersionReleaseNullableRelationFilter, VersionReleaseWhereInput> | null
    comments?: BacklogCommentListRelationFilter
  }

  export type BacklogItemOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    type?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    versionId?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    version?: VersionReleaseOrderByWithRelationInput
    comments?: BacklogCommentOrderByRelationAggregateInput
  }

  export type BacklogItemWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: BacklogItemWhereInput | BacklogItemWhereInput[]
    OR?: BacklogItemWhereInput[]
    NOT?: BacklogItemWhereInput | BacklogItemWhereInput[]
    title?: StringFilter<"BacklogItem"> | string
    description?: StringNullableFilter<"BacklogItem"> | string | null
    type?: StringFilter<"BacklogItem"> | string
    priority?: StringFilter<"BacklogItem"> | string
    status?: StringFilter<"BacklogItem"> | string
    versionId?: IntNullableFilter<"BacklogItem"> | number | null
    created_at?: DateTimeFilter<"BacklogItem"> | Date | string
    updated_at?: DateTimeFilter<"BacklogItem"> | Date | string
    version?: XOR<VersionReleaseNullableRelationFilter, VersionReleaseWhereInput> | null
    comments?: BacklogCommentListRelationFilter
  }, "id">

  export type BacklogItemOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    type?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    versionId?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: BacklogItemCountOrderByAggregateInput
    _avg?: BacklogItemAvgOrderByAggregateInput
    _max?: BacklogItemMaxOrderByAggregateInput
    _min?: BacklogItemMinOrderByAggregateInput
    _sum?: BacklogItemSumOrderByAggregateInput
  }

  export type BacklogItemScalarWhereWithAggregatesInput = {
    AND?: BacklogItemScalarWhereWithAggregatesInput | BacklogItemScalarWhereWithAggregatesInput[]
    OR?: BacklogItemScalarWhereWithAggregatesInput[]
    NOT?: BacklogItemScalarWhereWithAggregatesInput | BacklogItemScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"BacklogItem"> | number
    title?: StringWithAggregatesFilter<"BacklogItem"> | string
    description?: StringNullableWithAggregatesFilter<"BacklogItem"> | string | null
    type?: StringWithAggregatesFilter<"BacklogItem"> | string
    priority?: StringWithAggregatesFilter<"BacklogItem"> | string
    status?: StringWithAggregatesFilter<"BacklogItem"> | string
    versionId?: IntNullableWithAggregatesFilter<"BacklogItem"> | number | null
    created_at?: DateTimeWithAggregatesFilter<"BacklogItem"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"BacklogItem"> | Date | string
  }

  export type BacklogCommentWhereInput = {
    AND?: BacklogCommentWhereInput | BacklogCommentWhereInput[]
    OR?: BacklogCommentWhereInput[]
    NOT?: BacklogCommentWhereInput | BacklogCommentWhereInput[]
    id?: IntFilter<"BacklogComment"> | number
    backlogItemId?: IntFilter<"BacklogComment"> | number
    content?: StringFilter<"BacklogComment"> | string
    author?: StringNullableFilter<"BacklogComment"> | string | null
    created_at?: DateTimeFilter<"BacklogComment"> | Date | string
    backlogItem?: XOR<BacklogItemRelationFilter, BacklogItemWhereInput>
  }

  export type BacklogCommentOrderByWithRelationInput = {
    id?: SortOrder
    backlogItemId?: SortOrder
    content?: SortOrder
    author?: SortOrderInput | SortOrder
    created_at?: SortOrder
    backlogItem?: BacklogItemOrderByWithRelationInput
  }

  export type BacklogCommentWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: BacklogCommentWhereInput | BacklogCommentWhereInput[]
    OR?: BacklogCommentWhereInput[]
    NOT?: BacklogCommentWhereInput | BacklogCommentWhereInput[]
    backlogItemId?: IntFilter<"BacklogComment"> | number
    content?: StringFilter<"BacklogComment"> | string
    author?: StringNullableFilter<"BacklogComment"> | string | null
    created_at?: DateTimeFilter<"BacklogComment"> | Date | string
    backlogItem?: XOR<BacklogItemRelationFilter, BacklogItemWhereInput>
  }, "id">

  export type BacklogCommentOrderByWithAggregationInput = {
    id?: SortOrder
    backlogItemId?: SortOrder
    content?: SortOrder
    author?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: BacklogCommentCountOrderByAggregateInput
    _avg?: BacklogCommentAvgOrderByAggregateInput
    _max?: BacklogCommentMaxOrderByAggregateInput
    _min?: BacklogCommentMinOrderByAggregateInput
    _sum?: BacklogCommentSumOrderByAggregateInput
  }

  export type BacklogCommentScalarWhereWithAggregatesInput = {
    AND?: BacklogCommentScalarWhereWithAggregatesInput | BacklogCommentScalarWhereWithAggregatesInput[]
    OR?: BacklogCommentScalarWhereWithAggregatesInput[]
    NOT?: BacklogCommentScalarWhereWithAggregatesInput | BacklogCommentScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"BacklogComment"> | number
    backlogItemId?: IntWithAggregatesFilter<"BacklogComment"> | number
    content?: StringWithAggregatesFilter<"BacklogComment"> | string
    author?: StringNullableWithAggregatesFilter<"BacklogComment"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"BacklogComment"> | Date | string
  }

  export type VersionReleaseWhereInput = {
    AND?: VersionReleaseWhereInput | VersionReleaseWhereInput[]
    OR?: VersionReleaseWhereInput[]
    NOT?: VersionReleaseWhereInput | VersionReleaseWhereInput[]
    id?: IntFilter<"VersionRelease"> | number
    versionNumber?: StringFilter<"VersionRelease"> | string
    notes?: StringNullableFilter<"VersionRelease"> | string | null
    releasedAt?: DateTimeFilter<"VersionRelease"> | Date | string
    created_at?: DateTimeFilter<"VersionRelease"> | Date | string
    backlogItems?: BacklogItemListRelationFilter
  }

  export type VersionReleaseOrderByWithRelationInput = {
    id?: SortOrder
    versionNumber?: SortOrder
    notes?: SortOrderInput | SortOrder
    releasedAt?: SortOrder
    created_at?: SortOrder
    backlogItems?: BacklogItemOrderByRelationAggregateInput
  }

  export type VersionReleaseWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    versionNumber?: string
    AND?: VersionReleaseWhereInput | VersionReleaseWhereInput[]
    OR?: VersionReleaseWhereInput[]
    NOT?: VersionReleaseWhereInput | VersionReleaseWhereInput[]
    notes?: StringNullableFilter<"VersionRelease"> | string | null
    releasedAt?: DateTimeFilter<"VersionRelease"> | Date | string
    created_at?: DateTimeFilter<"VersionRelease"> | Date | string
    backlogItems?: BacklogItemListRelationFilter
  }, "id" | "versionNumber">

  export type VersionReleaseOrderByWithAggregationInput = {
    id?: SortOrder
    versionNumber?: SortOrder
    notes?: SortOrderInput | SortOrder
    releasedAt?: SortOrder
    created_at?: SortOrder
    _count?: VersionReleaseCountOrderByAggregateInput
    _avg?: VersionReleaseAvgOrderByAggregateInput
    _max?: VersionReleaseMaxOrderByAggregateInput
    _min?: VersionReleaseMinOrderByAggregateInput
    _sum?: VersionReleaseSumOrderByAggregateInput
  }

  export type VersionReleaseScalarWhereWithAggregatesInput = {
    AND?: VersionReleaseScalarWhereWithAggregatesInput | VersionReleaseScalarWhereWithAggregatesInput[]
    OR?: VersionReleaseScalarWhereWithAggregatesInput[]
    NOT?: VersionReleaseScalarWhereWithAggregatesInput | VersionReleaseScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"VersionRelease"> | number
    versionNumber?: StringWithAggregatesFilter<"VersionRelease"> | string
    notes?: StringNullableWithAggregatesFilter<"VersionRelease"> | string | null
    releasedAt?: DateTimeWithAggregatesFilter<"VersionRelease"> | Date | string
    created_at?: DateTimeWithAggregatesFilter<"VersionRelease"> | Date | string
  }

  export type BacklogItemCreateInput = {
    title: string
    description?: string | null
    type?: string
    priority?: string
    status?: string
    created_at?: Date | string
    updated_at?: Date | string
    version?: VersionReleaseCreateNestedOneWithoutBacklogItemsInput
    comments?: BacklogCommentCreateNestedManyWithoutBacklogItemInput
  }

  export type BacklogItemUncheckedCreateInput = {
    id?: number
    title: string
    description?: string | null
    type?: string
    priority?: string
    status?: string
    versionId?: number | null
    created_at?: Date | string
    updated_at?: Date | string
    comments?: BacklogCommentUncheckedCreateNestedManyWithoutBacklogItemInput
  }

  export type BacklogItemUpdateInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    version?: VersionReleaseUpdateOneWithoutBacklogItemsNestedInput
    comments?: BacklogCommentUpdateManyWithoutBacklogItemNestedInput
  }

  export type BacklogItemUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    versionId?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: BacklogCommentUncheckedUpdateManyWithoutBacklogItemNestedInput
  }

  export type BacklogItemCreateManyInput = {
    id?: number
    title: string
    description?: string | null
    type?: string
    priority?: string
    status?: string
    versionId?: number | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type BacklogItemUpdateManyMutationInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BacklogItemUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    versionId?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BacklogCommentCreateInput = {
    content: string
    author?: string | null
    created_at?: Date | string
    backlogItem: BacklogItemCreateNestedOneWithoutCommentsInput
  }

  export type BacklogCommentUncheckedCreateInput = {
    id?: number
    backlogItemId: number
    content: string
    author?: string | null
    created_at?: Date | string
  }

  export type BacklogCommentUpdateInput = {
    content?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    backlogItem?: BacklogItemUpdateOneRequiredWithoutCommentsNestedInput
  }

  export type BacklogCommentUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    backlogItemId?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BacklogCommentCreateManyInput = {
    id?: number
    backlogItemId: number
    content: string
    author?: string | null
    created_at?: Date | string
  }

  export type BacklogCommentUpdateManyMutationInput = {
    content?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BacklogCommentUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    backlogItemId?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VersionReleaseCreateInput = {
    versionNumber: string
    notes?: string | null
    releasedAt?: Date | string
    created_at?: Date | string
    backlogItems?: BacklogItemCreateNestedManyWithoutVersionInput
  }

  export type VersionReleaseUncheckedCreateInput = {
    id?: number
    versionNumber: string
    notes?: string | null
    releasedAt?: Date | string
    created_at?: Date | string
    backlogItems?: BacklogItemUncheckedCreateNestedManyWithoutVersionInput
  }

  export type VersionReleaseUpdateInput = {
    versionNumber?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    releasedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    backlogItems?: BacklogItemUpdateManyWithoutVersionNestedInput
  }

  export type VersionReleaseUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    versionNumber?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    releasedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    backlogItems?: BacklogItemUncheckedUpdateManyWithoutVersionNestedInput
  }

  export type VersionReleaseCreateManyInput = {
    id?: number
    versionNumber: string
    notes?: string | null
    releasedAt?: Date | string
    created_at?: Date | string
  }

  export type VersionReleaseUpdateManyMutationInput = {
    versionNumber?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    releasedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VersionReleaseUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    versionNumber?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    releasedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type VersionReleaseNullableRelationFilter = {
    is?: VersionReleaseWhereInput | null
    isNot?: VersionReleaseWhereInput | null
  }

  export type BacklogCommentListRelationFilter = {
    every?: BacklogCommentWhereInput
    some?: BacklogCommentWhereInput
    none?: BacklogCommentWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type BacklogCommentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BacklogItemCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    type?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    versionId?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type BacklogItemAvgOrderByAggregateInput = {
    id?: SortOrder
    versionId?: SortOrder
  }

  export type BacklogItemMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    type?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    versionId?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type BacklogItemMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    type?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    versionId?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type BacklogItemSumOrderByAggregateInput = {
    id?: SortOrder
    versionId?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BacklogItemRelationFilter = {
    is?: BacklogItemWhereInput
    isNot?: BacklogItemWhereInput
  }

  export type BacklogCommentCountOrderByAggregateInput = {
    id?: SortOrder
    backlogItemId?: SortOrder
    content?: SortOrder
    author?: SortOrder
    created_at?: SortOrder
  }

  export type BacklogCommentAvgOrderByAggregateInput = {
    id?: SortOrder
    backlogItemId?: SortOrder
  }

  export type BacklogCommentMaxOrderByAggregateInput = {
    id?: SortOrder
    backlogItemId?: SortOrder
    content?: SortOrder
    author?: SortOrder
    created_at?: SortOrder
  }

  export type BacklogCommentMinOrderByAggregateInput = {
    id?: SortOrder
    backlogItemId?: SortOrder
    content?: SortOrder
    author?: SortOrder
    created_at?: SortOrder
  }

  export type BacklogCommentSumOrderByAggregateInput = {
    id?: SortOrder
    backlogItemId?: SortOrder
  }

  export type BacklogItemListRelationFilter = {
    every?: BacklogItemWhereInput
    some?: BacklogItemWhereInput
    none?: BacklogItemWhereInput
  }

  export type BacklogItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VersionReleaseCountOrderByAggregateInput = {
    id?: SortOrder
    versionNumber?: SortOrder
    notes?: SortOrder
    releasedAt?: SortOrder
    created_at?: SortOrder
  }

  export type VersionReleaseAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type VersionReleaseMaxOrderByAggregateInput = {
    id?: SortOrder
    versionNumber?: SortOrder
    notes?: SortOrder
    releasedAt?: SortOrder
    created_at?: SortOrder
  }

  export type VersionReleaseMinOrderByAggregateInput = {
    id?: SortOrder
    versionNumber?: SortOrder
    notes?: SortOrder
    releasedAt?: SortOrder
    created_at?: SortOrder
  }

  export type VersionReleaseSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type VersionReleaseCreateNestedOneWithoutBacklogItemsInput = {
    create?: XOR<VersionReleaseCreateWithoutBacklogItemsInput, VersionReleaseUncheckedCreateWithoutBacklogItemsInput>
    connectOrCreate?: VersionReleaseCreateOrConnectWithoutBacklogItemsInput
    connect?: VersionReleaseWhereUniqueInput
  }

  export type BacklogCommentCreateNestedManyWithoutBacklogItemInput = {
    create?: XOR<BacklogCommentCreateWithoutBacklogItemInput, BacklogCommentUncheckedCreateWithoutBacklogItemInput> | BacklogCommentCreateWithoutBacklogItemInput[] | BacklogCommentUncheckedCreateWithoutBacklogItemInput[]
    connectOrCreate?: BacklogCommentCreateOrConnectWithoutBacklogItemInput | BacklogCommentCreateOrConnectWithoutBacklogItemInput[]
    createMany?: BacklogCommentCreateManyBacklogItemInputEnvelope
    connect?: BacklogCommentWhereUniqueInput | BacklogCommentWhereUniqueInput[]
  }

  export type BacklogCommentUncheckedCreateNestedManyWithoutBacklogItemInput = {
    create?: XOR<BacklogCommentCreateWithoutBacklogItemInput, BacklogCommentUncheckedCreateWithoutBacklogItemInput> | BacklogCommentCreateWithoutBacklogItemInput[] | BacklogCommentUncheckedCreateWithoutBacklogItemInput[]
    connectOrCreate?: BacklogCommentCreateOrConnectWithoutBacklogItemInput | BacklogCommentCreateOrConnectWithoutBacklogItemInput[]
    createMany?: BacklogCommentCreateManyBacklogItemInputEnvelope
    connect?: BacklogCommentWhereUniqueInput | BacklogCommentWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type VersionReleaseUpdateOneWithoutBacklogItemsNestedInput = {
    create?: XOR<VersionReleaseCreateWithoutBacklogItemsInput, VersionReleaseUncheckedCreateWithoutBacklogItemsInput>
    connectOrCreate?: VersionReleaseCreateOrConnectWithoutBacklogItemsInput
    upsert?: VersionReleaseUpsertWithoutBacklogItemsInput
    disconnect?: VersionReleaseWhereInput | boolean
    delete?: VersionReleaseWhereInput | boolean
    connect?: VersionReleaseWhereUniqueInput
    update?: XOR<XOR<VersionReleaseUpdateToOneWithWhereWithoutBacklogItemsInput, VersionReleaseUpdateWithoutBacklogItemsInput>, VersionReleaseUncheckedUpdateWithoutBacklogItemsInput>
  }

  export type BacklogCommentUpdateManyWithoutBacklogItemNestedInput = {
    create?: XOR<BacklogCommentCreateWithoutBacklogItemInput, BacklogCommentUncheckedCreateWithoutBacklogItemInput> | BacklogCommentCreateWithoutBacklogItemInput[] | BacklogCommentUncheckedCreateWithoutBacklogItemInput[]
    connectOrCreate?: BacklogCommentCreateOrConnectWithoutBacklogItemInput | BacklogCommentCreateOrConnectWithoutBacklogItemInput[]
    upsert?: BacklogCommentUpsertWithWhereUniqueWithoutBacklogItemInput | BacklogCommentUpsertWithWhereUniqueWithoutBacklogItemInput[]
    createMany?: BacklogCommentCreateManyBacklogItemInputEnvelope
    set?: BacklogCommentWhereUniqueInput | BacklogCommentWhereUniqueInput[]
    disconnect?: BacklogCommentWhereUniqueInput | BacklogCommentWhereUniqueInput[]
    delete?: BacklogCommentWhereUniqueInput | BacklogCommentWhereUniqueInput[]
    connect?: BacklogCommentWhereUniqueInput | BacklogCommentWhereUniqueInput[]
    update?: BacklogCommentUpdateWithWhereUniqueWithoutBacklogItemInput | BacklogCommentUpdateWithWhereUniqueWithoutBacklogItemInput[]
    updateMany?: BacklogCommentUpdateManyWithWhereWithoutBacklogItemInput | BacklogCommentUpdateManyWithWhereWithoutBacklogItemInput[]
    deleteMany?: BacklogCommentScalarWhereInput | BacklogCommentScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BacklogCommentUncheckedUpdateManyWithoutBacklogItemNestedInput = {
    create?: XOR<BacklogCommentCreateWithoutBacklogItemInput, BacklogCommentUncheckedCreateWithoutBacklogItemInput> | BacklogCommentCreateWithoutBacklogItemInput[] | BacklogCommentUncheckedCreateWithoutBacklogItemInput[]
    connectOrCreate?: BacklogCommentCreateOrConnectWithoutBacklogItemInput | BacklogCommentCreateOrConnectWithoutBacklogItemInput[]
    upsert?: BacklogCommentUpsertWithWhereUniqueWithoutBacklogItemInput | BacklogCommentUpsertWithWhereUniqueWithoutBacklogItemInput[]
    createMany?: BacklogCommentCreateManyBacklogItemInputEnvelope
    set?: BacklogCommentWhereUniqueInput | BacklogCommentWhereUniqueInput[]
    disconnect?: BacklogCommentWhereUniqueInput | BacklogCommentWhereUniqueInput[]
    delete?: BacklogCommentWhereUniqueInput | BacklogCommentWhereUniqueInput[]
    connect?: BacklogCommentWhereUniqueInput | BacklogCommentWhereUniqueInput[]
    update?: BacklogCommentUpdateWithWhereUniqueWithoutBacklogItemInput | BacklogCommentUpdateWithWhereUniqueWithoutBacklogItemInput[]
    updateMany?: BacklogCommentUpdateManyWithWhereWithoutBacklogItemInput | BacklogCommentUpdateManyWithWhereWithoutBacklogItemInput[]
    deleteMany?: BacklogCommentScalarWhereInput | BacklogCommentScalarWhereInput[]
  }

  export type BacklogItemCreateNestedOneWithoutCommentsInput = {
    create?: XOR<BacklogItemCreateWithoutCommentsInput, BacklogItemUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: BacklogItemCreateOrConnectWithoutCommentsInput
    connect?: BacklogItemWhereUniqueInput
  }

  export type BacklogItemUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: XOR<BacklogItemCreateWithoutCommentsInput, BacklogItemUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: BacklogItemCreateOrConnectWithoutCommentsInput
    upsert?: BacklogItemUpsertWithoutCommentsInput
    connect?: BacklogItemWhereUniqueInput
    update?: XOR<XOR<BacklogItemUpdateToOneWithWhereWithoutCommentsInput, BacklogItemUpdateWithoutCommentsInput>, BacklogItemUncheckedUpdateWithoutCommentsInput>
  }

  export type BacklogItemCreateNestedManyWithoutVersionInput = {
    create?: XOR<BacklogItemCreateWithoutVersionInput, BacklogItemUncheckedCreateWithoutVersionInput> | BacklogItemCreateWithoutVersionInput[] | BacklogItemUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: BacklogItemCreateOrConnectWithoutVersionInput | BacklogItemCreateOrConnectWithoutVersionInput[]
    createMany?: BacklogItemCreateManyVersionInputEnvelope
    connect?: BacklogItemWhereUniqueInput | BacklogItemWhereUniqueInput[]
  }

  export type BacklogItemUncheckedCreateNestedManyWithoutVersionInput = {
    create?: XOR<BacklogItemCreateWithoutVersionInput, BacklogItemUncheckedCreateWithoutVersionInput> | BacklogItemCreateWithoutVersionInput[] | BacklogItemUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: BacklogItemCreateOrConnectWithoutVersionInput | BacklogItemCreateOrConnectWithoutVersionInput[]
    createMany?: BacklogItemCreateManyVersionInputEnvelope
    connect?: BacklogItemWhereUniqueInput | BacklogItemWhereUniqueInput[]
  }

  export type BacklogItemUpdateManyWithoutVersionNestedInput = {
    create?: XOR<BacklogItemCreateWithoutVersionInput, BacklogItemUncheckedCreateWithoutVersionInput> | BacklogItemCreateWithoutVersionInput[] | BacklogItemUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: BacklogItemCreateOrConnectWithoutVersionInput | BacklogItemCreateOrConnectWithoutVersionInput[]
    upsert?: BacklogItemUpsertWithWhereUniqueWithoutVersionInput | BacklogItemUpsertWithWhereUniqueWithoutVersionInput[]
    createMany?: BacklogItemCreateManyVersionInputEnvelope
    set?: BacklogItemWhereUniqueInput | BacklogItemWhereUniqueInput[]
    disconnect?: BacklogItemWhereUniqueInput | BacklogItemWhereUniqueInput[]
    delete?: BacklogItemWhereUniqueInput | BacklogItemWhereUniqueInput[]
    connect?: BacklogItemWhereUniqueInput | BacklogItemWhereUniqueInput[]
    update?: BacklogItemUpdateWithWhereUniqueWithoutVersionInput | BacklogItemUpdateWithWhereUniqueWithoutVersionInput[]
    updateMany?: BacklogItemUpdateManyWithWhereWithoutVersionInput | BacklogItemUpdateManyWithWhereWithoutVersionInput[]
    deleteMany?: BacklogItemScalarWhereInput | BacklogItemScalarWhereInput[]
  }

  export type BacklogItemUncheckedUpdateManyWithoutVersionNestedInput = {
    create?: XOR<BacklogItemCreateWithoutVersionInput, BacklogItemUncheckedCreateWithoutVersionInput> | BacklogItemCreateWithoutVersionInput[] | BacklogItemUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: BacklogItemCreateOrConnectWithoutVersionInput | BacklogItemCreateOrConnectWithoutVersionInput[]
    upsert?: BacklogItemUpsertWithWhereUniqueWithoutVersionInput | BacklogItemUpsertWithWhereUniqueWithoutVersionInput[]
    createMany?: BacklogItemCreateManyVersionInputEnvelope
    set?: BacklogItemWhereUniqueInput | BacklogItemWhereUniqueInput[]
    disconnect?: BacklogItemWhereUniqueInput | BacklogItemWhereUniqueInput[]
    delete?: BacklogItemWhereUniqueInput | BacklogItemWhereUniqueInput[]
    connect?: BacklogItemWhereUniqueInput | BacklogItemWhereUniqueInput[]
    update?: BacklogItemUpdateWithWhereUniqueWithoutVersionInput | BacklogItemUpdateWithWhereUniqueWithoutVersionInput[]
    updateMany?: BacklogItemUpdateManyWithWhereWithoutVersionInput | BacklogItemUpdateManyWithWhereWithoutVersionInput[]
    deleteMany?: BacklogItemScalarWhereInput | BacklogItemScalarWhereInput[]
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type VersionReleaseCreateWithoutBacklogItemsInput = {
    versionNumber: string
    notes?: string | null
    releasedAt?: Date | string
    created_at?: Date | string
  }

  export type VersionReleaseUncheckedCreateWithoutBacklogItemsInput = {
    id?: number
    versionNumber: string
    notes?: string | null
    releasedAt?: Date | string
    created_at?: Date | string
  }

  export type VersionReleaseCreateOrConnectWithoutBacklogItemsInput = {
    where: VersionReleaseWhereUniqueInput
    create: XOR<VersionReleaseCreateWithoutBacklogItemsInput, VersionReleaseUncheckedCreateWithoutBacklogItemsInput>
  }

  export type BacklogCommentCreateWithoutBacklogItemInput = {
    content: string
    author?: string | null
    created_at?: Date | string
  }

  export type BacklogCommentUncheckedCreateWithoutBacklogItemInput = {
    id?: number
    content: string
    author?: string | null
    created_at?: Date | string
  }

  export type BacklogCommentCreateOrConnectWithoutBacklogItemInput = {
    where: BacklogCommentWhereUniqueInput
    create: XOR<BacklogCommentCreateWithoutBacklogItemInput, BacklogCommentUncheckedCreateWithoutBacklogItemInput>
  }

  export type BacklogCommentCreateManyBacklogItemInputEnvelope = {
    data: BacklogCommentCreateManyBacklogItemInput | BacklogCommentCreateManyBacklogItemInput[]
    skipDuplicates?: boolean
  }

  export type VersionReleaseUpsertWithoutBacklogItemsInput = {
    update: XOR<VersionReleaseUpdateWithoutBacklogItemsInput, VersionReleaseUncheckedUpdateWithoutBacklogItemsInput>
    create: XOR<VersionReleaseCreateWithoutBacklogItemsInput, VersionReleaseUncheckedCreateWithoutBacklogItemsInput>
    where?: VersionReleaseWhereInput
  }

  export type VersionReleaseUpdateToOneWithWhereWithoutBacklogItemsInput = {
    where?: VersionReleaseWhereInput
    data: XOR<VersionReleaseUpdateWithoutBacklogItemsInput, VersionReleaseUncheckedUpdateWithoutBacklogItemsInput>
  }

  export type VersionReleaseUpdateWithoutBacklogItemsInput = {
    versionNumber?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    releasedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VersionReleaseUncheckedUpdateWithoutBacklogItemsInput = {
    id?: IntFieldUpdateOperationsInput | number
    versionNumber?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    releasedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BacklogCommentUpsertWithWhereUniqueWithoutBacklogItemInput = {
    where: BacklogCommentWhereUniqueInput
    update: XOR<BacklogCommentUpdateWithoutBacklogItemInput, BacklogCommentUncheckedUpdateWithoutBacklogItemInput>
    create: XOR<BacklogCommentCreateWithoutBacklogItemInput, BacklogCommentUncheckedCreateWithoutBacklogItemInput>
  }

  export type BacklogCommentUpdateWithWhereUniqueWithoutBacklogItemInput = {
    where: BacklogCommentWhereUniqueInput
    data: XOR<BacklogCommentUpdateWithoutBacklogItemInput, BacklogCommentUncheckedUpdateWithoutBacklogItemInput>
  }

  export type BacklogCommentUpdateManyWithWhereWithoutBacklogItemInput = {
    where: BacklogCommentScalarWhereInput
    data: XOR<BacklogCommentUpdateManyMutationInput, BacklogCommentUncheckedUpdateManyWithoutBacklogItemInput>
  }

  export type BacklogCommentScalarWhereInput = {
    AND?: BacklogCommentScalarWhereInput | BacklogCommentScalarWhereInput[]
    OR?: BacklogCommentScalarWhereInput[]
    NOT?: BacklogCommentScalarWhereInput | BacklogCommentScalarWhereInput[]
    id?: IntFilter<"BacklogComment"> | number
    backlogItemId?: IntFilter<"BacklogComment"> | number
    content?: StringFilter<"BacklogComment"> | string
    author?: StringNullableFilter<"BacklogComment"> | string | null
    created_at?: DateTimeFilter<"BacklogComment"> | Date | string
  }

  export type BacklogItemCreateWithoutCommentsInput = {
    title: string
    description?: string | null
    type?: string
    priority?: string
    status?: string
    created_at?: Date | string
    updated_at?: Date | string
    version?: VersionReleaseCreateNestedOneWithoutBacklogItemsInput
  }

  export type BacklogItemUncheckedCreateWithoutCommentsInput = {
    id?: number
    title: string
    description?: string | null
    type?: string
    priority?: string
    status?: string
    versionId?: number | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type BacklogItemCreateOrConnectWithoutCommentsInput = {
    where: BacklogItemWhereUniqueInput
    create: XOR<BacklogItemCreateWithoutCommentsInput, BacklogItemUncheckedCreateWithoutCommentsInput>
  }

  export type BacklogItemUpsertWithoutCommentsInput = {
    update: XOR<BacklogItemUpdateWithoutCommentsInput, BacklogItemUncheckedUpdateWithoutCommentsInput>
    create: XOR<BacklogItemCreateWithoutCommentsInput, BacklogItemUncheckedCreateWithoutCommentsInput>
    where?: BacklogItemWhereInput
  }

  export type BacklogItemUpdateToOneWithWhereWithoutCommentsInput = {
    where?: BacklogItemWhereInput
    data: XOR<BacklogItemUpdateWithoutCommentsInput, BacklogItemUncheckedUpdateWithoutCommentsInput>
  }

  export type BacklogItemUpdateWithoutCommentsInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    version?: VersionReleaseUpdateOneWithoutBacklogItemsNestedInput
  }

  export type BacklogItemUncheckedUpdateWithoutCommentsInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    versionId?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BacklogItemCreateWithoutVersionInput = {
    title: string
    description?: string | null
    type?: string
    priority?: string
    status?: string
    created_at?: Date | string
    updated_at?: Date | string
    comments?: BacklogCommentCreateNestedManyWithoutBacklogItemInput
  }

  export type BacklogItemUncheckedCreateWithoutVersionInput = {
    id?: number
    title: string
    description?: string | null
    type?: string
    priority?: string
    status?: string
    created_at?: Date | string
    updated_at?: Date | string
    comments?: BacklogCommentUncheckedCreateNestedManyWithoutBacklogItemInput
  }

  export type BacklogItemCreateOrConnectWithoutVersionInput = {
    where: BacklogItemWhereUniqueInput
    create: XOR<BacklogItemCreateWithoutVersionInput, BacklogItemUncheckedCreateWithoutVersionInput>
  }

  export type BacklogItemCreateManyVersionInputEnvelope = {
    data: BacklogItemCreateManyVersionInput | BacklogItemCreateManyVersionInput[]
    skipDuplicates?: boolean
  }

  export type BacklogItemUpsertWithWhereUniqueWithoutVersionInput = {
    where: BacklogItemWhereUniqueInput
    update: XOR<BacklogItemUpdateWithoutVersionInput, BacklogItemUncheckedUpdateWithoutVersionInput>
    create: XOR<BacklogItemCreateWithoutVersionInput, BacklogItemUncheckedCreateWithoutVersionInput>
  }

  export type BacklogItemUpdateWithWhereUniqueWithoutVersionInput = {
    where: BacklogItemWhereUniqueInput
    data: XOR<BacklogItemUpdateWithoutVersionInput, BacklogItemUncheckedUpdateWithoutVersionInput>
  }

  export type BacklogItemUpdateManyWithWhereWithoutVersionInput = {
    where: BacklogItemScalarWhereInput
    data: XOR<BacklogItemUpdateManyMutationInput, BacklogItemUncheckedUpdateManyWithoutVersionInput>
  }

  export type BacklogItemScalarWhereInput = {
    AND?: BacklogItemScalarWhereInput | BacklogItemScalarWhereInput[]
    OR?: BacklogItemScalarWhereInput[]
    NOT?: BacklogItemScalarWhereInput | BacklogItemScalarWhereInput[]
    id?: IntFilter<"BacklogItem"> | number
    title?: StringFilter<"BacklogItem"> | string
    description?: StringNullableFilter<"BacklogItem"> | string | null
    type?: StringFilter<"BacklogItem"> | string
    priority?: StringFilter<"BacklogItem"> | string
    status?: StringFilter<"BacklogItem"> | string
    versionId?: IntNullableFilter<"BacklogItem"> | number | null
    created_at?: DateTimeFilter<"BacklogItem"> | Date | string
    updated_at?: DateTimeFilter<"BacklogItem"> | Date | string
  }

  export type BacklogCommentCreateManyBacklogItemInput = {
    id?: number
    content: string
    author?: string | null
    created_at?: Date | string
  }

  export type BacklogCommentUpdateWithoutBacklogItemInput = {
    content?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BacklogCommentUncheckedUpdateWithoutBacklogItemInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BacklogCommentUncheckedUpdateManyWithoutBacklogItemInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BacklogItemCreateManyVersionInput = {
    id?: number
    title: string
    description?: string | null
    type?: string
    priority?: string
    status?: string
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type BacklogItemUpdateWithoutVersionInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: BacklogCommentUpdateManyWithoutBacklogItemNestedInput
  }

  export type BacklogItemUncheckedUpdateWithoutVersionInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: BacklogCommentUncheckedUpdateManyWithoutBacklogItemNestedInput
  }

  export type BacklogItemUncheckedUpdateManyWithoutVersionInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    priority?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use BacklogItemCountOutputTypeDefaultArgs instead
     */
    export type BacklogItemCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BacklogItemCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use VersionReleaseCountOutputTypeDefaultArgs instead
     */
    export type VersionReleaseCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = VersionReleaseCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use BacklogItemDefaultArgs instead
     */
    export type BacklogItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BacklogItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use BacklogCommentDefaultArgs instead
     */
    export type BacklogCommentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BacklogCommentDefaultArgs<ExtArgs>
    /**
     * @deprecated Use VersionReleaseDefaultArgs instead
     */
    export type VersionReleaseArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = VersionReleaseDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}