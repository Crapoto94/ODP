
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
 * Model AppSettings
 * 
 */
export type AppSettings = $Result.DefaultSelection<Prisma.$AppSettingsPayload>
/**
 * Model PostgresConfig
 * 
 */
export type PostgresConfig = $Result.DefaultSelection<Prisma.$PostgresConfigPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more AppSettings
 * const appSettings = await prisma.appSettings.findMany()
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
   * // Fetch zero or more AppSettings
   * const appSettings = await prisma.appSettings.findMany()
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
   * `prisma.appSettings`: Exposes CRUD operations for the **AppSettings** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AppSettings
    * const appSettings = await prisma.appSettings.findMany()
    * ```
    */
  get appSettings(): Prisma.AppSettingsDelegate<ExtArgs>;

  /**
   * `prisma.postgresConfig`: Exposes CRUD operations for the **PostgresConfig** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PostgresConfigs
    * const postgresConfigs = await prisma.postgresConfig.findMany()
    * ```
    */
  get postgresConfig(): Prisma.PostgresConfigDelegate<ExtArgs>;
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
    AppSettings: 'AppSettings',
    PostgresConfig: 'PostgresConfig'
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
      modelProps: "appSettings" | "postgresConfig"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      AppSettings: {
        payload: Prisma.$AppSettingsPayload<ExtArgs>
        fields: Prisma.AppSettingsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AppSettingsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AppSettingsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          findFirst: {
            args: Prisma.AppSettingsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AppSettingsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          findMany: {
            args: Prisma.AppSettingsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>[]
          }
          create: {
            args: Prisma.AppSettingsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          createMany: {
            args: Prisma.AppSettingsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AppSettingsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>[]
          }
          delete: {
            args: Prisma.AppSettingsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          update: {
            args: Prisma.AppSettingsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          deleteMany: {
            args: Prisma.AppSettingsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AppSettingsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AppSettingsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingsPayload>
          }
          aggregate: {
            args: Prisma.AppSettingsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAppSettings>
          }
          groupBy: {
            args: Prisma.AppSettingsGroupByArgs<ExtArgs>
            result: $Utils.Optional<AppSettingsGroupByOutputType>[]
          }
          count: {
            args: Prisma.AppSettingsCountArgs<ExtArgs>
            result: $Utils.Optional<AppSettingsCountAggregateOutputType> | number
          }
        }
      }
      PostgresConfig: {
        payload: Prisma.$PostgresConfigPayload<ExtArgs>
        fields: Prisma.PostgresConfigFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PostgresConfigFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostgresConfigPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PostgresConfigFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostgresConfigPayload>
          }
          findFirst: {
            args: Prisma.PostgresConfigFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostgresConfigPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PostgresConfigFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostgresConfigPayload>
          }
          findMany: {
            args: Prisma.PostgresConfigFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostgresConfigPayload>[]
          }
          create: {
            args: Prisma.PostgresConfigCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostgresConfigPayload>
          }
          createMany: {
            args: Prisma.PostgresConfigCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PostgresConfigCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostgresConfigPayload>[]
          }
          delete: {
            args: Prisma.PostgresConfigDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostgresConfigPayload>
          }
          update: {
            args: Prisma.PostgresConfigUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostgresConfigPayload>
          }
          deleteMany: {
            args: Prisma.PostgresConfigDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PostgresConfigUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PostgresConfigUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostgresConfigPayload>
          }
          aggregate: {
            args: Prisma.PostgresConfigAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePostgresConfig>
          }
          groupBy: {
            args: Prisma.PostgresConfigGroupByArgs<ExtArgs>
            result: $Utils.Optional<PostgresConfigGroupByOutputType>[]
          }
          count: {
            args: Prisma.PostgresConfigCountArgs<ExtArgs>
            result: $Utils.Optional<PostgresConfigCountAggregateOutputType> | number
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
   * Models
   */

  /**
   * Model AppSettings
   */

  export type AggregateAppSettings = {
    _count: AppSettingsCountAggregateOutputType | null
    _avg: AppSettingsAvgAggregateOutputType | null
    _sum: AppSettingsSumAggregateOutputType | null
    _min: AppSettingsMinAggregateOutputType | null
    _max: AppSettingsMaxAggregateOutputType | null
  }

  export type AppSettingsAvgAggregateOutputType = {
    id: number | null
    filienExercice: number | null
  }

  export type AppSettingsSumAggregateOutputType = {
    id: number | null
    filienExercice: number | null
  }

  export type AppSettingsMinAggregateOutputType = {
    id: number | null
    financeEmail: string | null
    appUrl: string | null
    apmUrl: string | null
    apmToken: string | null
    senderName: string | null
    senderEmail: string | null
    filienOrga: string | null
    filienBudget: string | null
    filienExercice: number | null
    filienAvancement: string | null
    filienRejetDispo: boolean | null
    filienRejetCA: boolean | null
    filienRejetMarche: boolean | null
    filienMouvement: string | null
    filienType: string | null
    filienLibelle: string | null
    filienCalendrier: string | null
    filienMonnaie: string | null
    filienMouvementEx: string | null
    filienPreBordereau: string | null
    filienPoste: string | null
    filienBordereau: string | null
    filienObjet: string | null
    filienChapitre: string | null
    filienNature: string | null
    filienFonction: string | null
    filienCodeInterne: string | null
    filienTypeMouvement: string | null
    filienSens: string | null
    filienStructure: string | null
    filienGestionnaire: string | null
    filienUncPj: string | null
    adDomain: string | null
    signataireRole: string | null
    signataireDelegation: string | null
    signataireNom: string | null
    footer1: string | null
    footer2: string | null
    footer3: string | null
    footerColor: string | null
    updated_at: Date | null
    filienUncPass: string | null
    filienUncUser: string | null
    filienUncDomain: string | null
    watermark: string | null
    dbMode: string | null
  }

  export type AppSettingsMaxAggregateOutputType = {
    id: number | null
    financeEmail: string | null
    appUrl: string | null
    apmUrl: string | null
    apmToken: string | null
    senderName: string | null
    senderEmail: string | null
    filienOrga: string | null
    filienBudget: string | null
    filienExercice: number | null
    filienAvancement: string | null
    filienRejetDispo: boolean | null
    filienRejetCA: boolean | null
    filienRejetMarche: boolean | null
    filienMouvement: string | null
    filienType: string | null
    filienLibelle: string | null
    filienCalendrier: string | null
    filienMonnaie: string | null
    filienMouvementEx: string | null
    filienPreBordereau: string | null
    filienPoste: string | null
    filienBordereau: string | null
    filienObjet: string | null
    filienChapitre: string | null
    filienNature: string | null
    filienFonction: string | null
    filienCodeInterne: string | null
    filienTypeMouvement: string | null
    filienSens: string | null
    filienStructure: string | null
    filienGestionnaire: string | null
    filienUncPj: string | null
    adDomain: string | null
    signataireRole: string | null
    signataireDelegation: string | null
    signataireNom: string | null
    footer1: string | null
    footer2: string | null
    footer3: string | null
    footerColor: string | null
    updated_at: Date | null
    filienUncPass: string | null
    filienUncUser: string | null
    filienUncDomain: string | null
    watermark: string | null
    dbMode: string | null
  }

  export type AppSettingsCountAggregateOutputType = {
    id: number
    financeEmail: number
    appUrl: number
    apmUrl: number
    apmToken: number
    senderName: number
    senderEmail: number
    filienOrga: number
    filienBudget: number
    filienExercice: number
    filienAvancement: number
    filienRejetDispo: number
    filienRejetCA: number
    filienRejetMarche: number
    filienMouvement: number
    filienType: number
    filienLibelle: number
    filienCalendrier: number
    filienMonnaie: number
    filienMouvementEx: number
    filienPreBordereau: number
    filienPoste: number
    filienBordereau: number
    filienObjet: number
    filienChapitre: number
    filienNature: number
    filienFonction: number
    filienCodeInterne: number
    filienTypeMouvement: number
    filienSens: number
    filienStructure: number
    filienGestionnaire: number
    filienUncPj: number
    adDomain: number
    signataireRole: number
    signataireDelegation: number
    signataireNom: number
    footer1: number
    footer2: number
    footer3: number
    footerColor: number
    updated_at: number
    filienUncPass: number
    filienUncUser: number
    filienUncDomain: number
    watermark: number
    dbMode: number
    _all: number
  }


  export type AppSettingsAvgAggregateInputType = {
    id?: true
    filienExercice?: true
  }

  export type AppSettingsSumAggregateInputType = {
    id?: true
    filienExercice?: true
  }

  export type AppSettingsMinAggregateInputType = {
    id?: true
    financeEmail?: true
    appUrl?: true
    apmUrl?: true
    apmToken?: true
    senderName?: true
    senderEmail?: true
    filienOrga?: true
    filienBudget?: true
    filienExercice?: true
    filienAvancement?: true
    filienRejetDispo?: true
    filienRejetCA?: true
    filienRejetMarche?: true
    filienMouvement?: true
    filienType?: true
    filienLibelle?: true
    filienCalendrier?: true
    filienMonnaie?: true
    filienMouvementEx?: true
    filienPreBordereau?: true
    filienPoste?: true
    filienBordereau?: true
    filienObjet?: true
    filienChapitre?: true
    filienNature?: true
    filienFonction?: true
    filienCodeInterne?: true
    filienTypeMouvement?: true
    filienSens?: true
    filienStructure?: true
    filienGestionnaire?: true
    filienUncPj?: true
    adDomain?: true
    signataireRole?: true
    signataireDelegation?: true
    signataireNom?: true
    footer1?: true
    footer2?: true
    footer3?: true
    footerColor?: true
    updated_at?: true
    filienUncPass?: true
    filienUncUser?: true
    filienUncDomain?: true
    watermark?: true
    dbMode?: true
  }

  export type AppSettingsMaxAggregateInputType = {
    id?: true
    financeEmail?: true
    appUrl?: true
    apmUrl?: true
    apmToken?: true
    senderName?: true
    senderEmail?: true
    filienOrga?: true
    filienBudget?: true
    filienExercice?: true
    filienAvancement?: true
    filienRejetDispo?: true
    filienRejetCA?: true
    filienRejetMarche?: true
    filienMouvement?: true
    filienType?: true
    filienLibelle?: true
    filienCalendrier?: true
    filienMonnaie?: true
    filienMouvementEx?: true
    filienPreBordereau?: true
    filienPoste?: true
    filienBordereau?: true
    filienObjet?: true
    filienChapitre?: true
    filienNature?: true
    filienFonction?: true
    filienCodeInterne?: true
    filienTypeMouvement?: true
    filienSens?: true
    filienStructure?: true
    filienGestionnaire?: true
    filienUncPj?: true
    adDomain?: true
    signataireRole?: true
    signataireDelegation?: true
    signataireNom?: true
    footer1?: true
    footer2?: true
    footer3?: true
    footerColor?: true
    updated_at?: true
    filienUncPass?: true
    filienUncUser?: true
    filienUncDomain?: true
    watermark?: true
    dbMode?: true
  }

  export type AppSettingsCountAggregateInputType = {
    id?: true
    financeEmail?: true
    appUrl?: true
    apmUrl?: true
    apmToken?: true
    senderName?: true
    senderEmail?: true
    filienOrga?: true
    filienBudget?: true
    filienExercice?: true
    filienAvancement?: true
    filienRejetDispo?: true
    filienRejetCA?: true
    filienRejetMarche?: true
    filienMouvement?: true
    filienType?: true
    filienLibelle?: true
    filienCalendrier?: true
    filienMonnaie?: true
    filienMouvementEx?: true
    filienPreBordereau?: true
    filienPoste?: true
    filienBordereau?: true
    filienObjet?: true
    filienChapitre?: true
    filienNature?: true
    filienFonction?: true
    filienCodeInterne?: true
    filienTypeMouvement?: true
    filienSens?: true
    filienStructure?: true
    filienGestionnaire?: true
    filienUncPj?: true
    adDomain?: true
    signataireRole?: true
    signataireDelegation?: true
    signataireNom?: true
    footer1?: true
    footer2?: true
    footer3?: true
    footerColor?: true
    updated_at?: true
    filienUncPass?: true
    filienUncUser?: true
    filienUncDomain?: true
    watermark?: true
    dbMode?: true
    _all?: true
  }

  export type AppSettingsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AppSettings to aggregate.
     */
    where?: AppSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingsOrderByWithRelationInput | AppSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AppSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AppSettings
    **/
    _count?: true | AppSettingsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AppSettingsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AppSettingsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AppSettingsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AppSettingsMaxAggregateInputType
  }

  export type GetAppSettingsAggregateType<T extends AppSettingsAggregateArgs> = {
        [P in keyof T & keyof AggregateAppSettings]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAppSettings[P]>
      : GetScalarType<T[P], AggregateAppSettings[P]>
  }




  export type AppSettingsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AppSettingsWhereInput
    orderBy?: AppSettingsOrderByWithAggregationInput | AppSettingsOrderByWithAggregationInput[]
    by: AppSettingsScalarFieldEnum[] | AppSettingsScalarFieldEnum
    having?: AppSettingsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AppSettingsCountAggregateInputType | true
    _avg?: AppSettingsAvgAggregateInputType
    _sum?: AppSettingsSumAggregateInputType
    _min?: AppSettingsMinAggregateInputType
    _max?: AppSettingsMaxAggregateInputType
  }

  export type AppSettingsGroupByOutputType = {
    id: number
    financeEmail: string | null
    appUrl: string | null
    apmUrl: string | null
    apmToken: string | null
    senderName: string | null
    senderEmail: string | null
    filienOrga: string | null
    filienBudget: string | null
    filienExercice: number | null
    filienAvancement: string | null
    filienRejetDispo: boolean | null
    filienRejetCA: boolean | null
    filienRejetMarche: boolean | null
    filienMouvement: string | null
    filienType: string | null
    filienLibelle: string | null
    filienCalendrier: string | null
    filienMonnaie: string | null
    filienMouvementEx: string | null
    filienPreBordereau: string | null
    filienPoste: string | null
    filienBordereau: string | null
    filienObjet: string | null
    filienChapitre: string | null
    filienNature: string | null
    filienFonction: string | null
    filienCodeInterne: string | null
    filienTypeMouvement: string | null
    filienSens: string | null
    filienStructure: string | null
    filienGestionnaire: string | null
    filienUncPj: string | null
    adDomain: string | null
    signataireRole: string | null
    signataireDelegation: string | null
    signataireNom: string | null
    footer1: string | null
    footer2: string | null
    footer3: string | null
    footerColor: string | null
    updated_at: Date
    filienUncPass: string | null
    filienUncUser: string | null
    filienUncDomain: string | null
    watermark: string | null
    dbMode: string
    _count: AppSettingsCountAggregateOutputType | null
    _avg: AppSettingsAvgAggregateOutputType | null
    _sum: AppSettingsSumAggregateOutputType | null
    _min: AppSettingsMinAggregateOutputType | null
    _max: AppSettingsMaxAggregateOutputType | null
  }

  type GetAppSettingsGroupByPayload<T extends AppSettingsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AppSettingsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AppSettingsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AppSettingsGroupByOutputType[P]>
            : GetScalarType<T[P], AppSettingsGroupByOutputType[P]>
        }
      >
    >


  export type AppSettingsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    financeEmail?: boolean
    appUrl?: boolean
    apmUrl?: boolean
    apmToken?: boolean
    senderName?: boolean
    senderEmail?: boolean
    filienOrga?: boolean
    filienBudget?: boolean
    filienExercice?: boolean
    filienAvancement?: boolean
    filienRejetDispo?: boolean
    filienRejetCA?: boolean
    filienRejetMarche?: boolean
    filienMouvement?: boolean
    filienType?: boolean
    filienLibelle?: boolean
    filienCalendrier?: boolean
    filienMonnaie?: boolean
    filienMouvementEx?: boolean
    filienPreBordereau?: boolean
    filienPoste?: boolean
    filienBordereau?: boolean
    filienObjet?: boolean
    filienChapitre?: boolean
    filienNature?: boolean
    filienFonction?: boolean
    filienCodeInterne?: boolean
    filienTypeMouvement?: boolean
    filienSens?: boolean
    filienStructure?: boolean
    filienGestionnaire?: boolean
    filienUncPj?: boolean
    adDomain?: boolean
    signataireRole?: boolean
    signataireDelegation?: boolean
    signataireNom?: boolean
    footer1?: boolean
    footer2?: boolean
    footer3?: boolean
    footerColor?: boolean
    updated_at?: boolean
    filienUncPass?: boolean
    filienUncUser?: boolean
    filienUncDomain?: boolean
    watermark?: boolean
    dbMode?: boolean
  }, ExtArgs["result"]["appSettings"]>

  export type AppSettingsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    financeEmail?: boolean
    appUrl?: boolean
    apmUrl?: boolean
    apmToken?: boolean
    senderName?: boolean
    senderEmail?: boolean
    filienOrga?: boolean
    filienBudget?: boolean
    filienExercice?: boolean
    filienAvancement?: boolean
    filienRejetDispo?: boolean
    filienRejetCA?: boolean
    filienRejetMarche?: boolean
    filienMouvement?: boolean
    filienType?: boolean
    filienLibelle?: boolean
    filienCalendrier?: boolean
    filienMonnaie?: boolean
    filienMouvementEx?: boolean
    filienPreBordereau?: boolean
    filienPoste?: boolean
    filienBordereau?: boolean
    filienObjet?: boolean
    filienChapitre?: boolean
    filienNature?: boolean
    filienFonction?: boolean
    filienCodeInterne?: boolean
    filienTypeMouvement?: boolean
    filienSens?: boolean
    filienStructure?: boolean
    filienGestionnaire?: boolean
    filienUncPj?: boolean
    adDomain?: boolean
    signataireRole?: boolean
    signataireDelegation?: boolean
    signataireNom?: boolean
    footer1?: boolean
    footer2?: boolean
    footer3?: boolean
    footerColor?: boolean
    updated_at?: boolean
    filienUncPass?: boolean
    filienUncUser?: boolean
    filienUncDomain?: boolean
    watermark?: boolean
    dbMode?: boolean
  }, ExtArgs["result"]["appSettings"]>

  export type AppSettingsSelectScalar = {
    id?: boolean
    financeEmail?: boolean
    appUrl?: boolean
    apmUrl?: boolean
    apmToken?: boolean
    senderName?: boolean
    senderEmail?: boolean
    filienOrga?: boolean
    filienBudget?: boolean
    filienExercice?: boolean
    filienAvancement?: boolean
    filienRejetDispo?: boolean
    filienRejetCA?: boolean
    filienRejetMarche?: boolean
    filienMouvement?: boolean
    filienType?: boolean
    filienLibelle?: boolean
    filienCalendrier?: boolean
    filienMonnaie?: boolean
    filienMouvementEx?: boolean
    filienPreBordereau?: boolean
    filienPoste?: boolean
    filienBordereau?: boolean
    filienObjet?: boolean
    filienChapitre?: boolean
    filienNature?: boolean
    filienFonction?: boolean
    filienCodeInterne?: boolean
    filienTypeMouvement?: boolean
    filienSens?: boolean
    filienStructure?: boolean
    filienGestionnaire?: boolean
    filienUncPj?: boolean
    adDomain?: boolean
    signataireRole?: boolean
    signataireDelegation?: boolean
    signataireNom?: boolean
    footer1?: boolean
    footer2?: boolean
    footer3?: boolean
    footerColor?: boolean
    updated_at?: boolean
    filienUncPass?: boolean
    filienUncUser?: boolean
    filienUncDomain?: boolean
    watermark?: boolean
    dbMode?: boolean
  }


  export type $AppSettingsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AppSettings"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      financeEmail: string | null
      appUrl: string | null
      apmUrl: string | null
      apmToken: string | null
      senderName: string | null
      senderEmail: string | null
      filienOrga: string | null
      filienBudget: string | null
      filienExercice: number | null
      filienAvancement: string | null
      filienRejetDispo: boolean | null
      filienRejetCA: boolean | null
      filienRejetMarche: boolean | null
      filienMouvement: string | null
      filienType: string | null
      filienLibelle: string | null
      filienCalendrier: string | null
      filienMonnaie: string | null
      filienMouvementEx: string | null
      filienPreBordereau: string | null
      filienPoste: string | null
      filienBordereau: string | null
      filienObjet: string | null
      filienChapitre: string | null
      filienNature: string | null
      filienFonction: string | null
      filienCodeInterne: string | null
      filienTypeMouvement: string | null
      filienSens: string | null
      filienStructure: string | null
      filienGestionnaire: string | null
      filienUncPj: string | null
      adDomain: string | null
      signataireRole: string | null
      signataireDelegation: string | null
      signataireNom: string | null
      footer1: string | null
      footer2: string | null
      footer3: string | null
      footerColor: string | null
      updated_at: Date
      filienUncPass: string | null
      filienUncUser: string | null
      filienUncDomain: string | null
      watermark: string | null
      dbMode: string
    }, ExtArgs["result"]["appSettings"]>
    composites: {}
  }

  type AppSettingsGetPayload<S extends boolean | null | undefined | AppSettingsDefaultArgs> = $Result.GetResult<Prisma.$AppSettingsPayload, S>

  type AppSettingsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<AppSettingsFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: AppSettingsCountAggregateInputType | true
    }

  export interface AppSettingsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AppSettings'], meta: { name: 'AppSettings' } }
    /**
     * Find zero or one AppSettings that matches the filter.
     * @param {AppSettingsFindUniqueArgs} args - Arguments to find a AppSettings
     * @example
     * // Get one AppSettings
     * const appSettings = await prisma.appSettings.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AppSettingsFindUniqueArgs>(args: SelectSubset<T, AppSettingsFindUniqueArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one AppSettings that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {AppSettingsFindUniqueOrThrowArgs} args - Arguments to find a AppSettings
     * @example
     * // Get one AppSettings
     * const appSettings = await prisma.appSettings.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AppSettingsFindUniqueOrThrowArgs>(args: SelectSubset<T, AppSettingsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first AppSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsFindFirstArgs} args - Arguments to find a AppSettings
     * @example
     * // Get one AppSettings
     * const appSettings = await prisma.appSettings.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AppSettingsFindFirstArgs>(args?: SelectSubset<T, AppSettingsFindFirstArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first AppSettings that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsFindFirstOrThrowArgs} args - Arguments to find a AppSettings
     * @example
     * // Get one AppSettings
     * const appSettings = await prisma.appSettings.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AppSettingsFindFirstOrThrowArgs>(args?: SelectSubset<T, AppSettingsFindFirstOrThrowArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more AppSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AppSettings
     * const appSettings = await prisma.appSettings.findMany()
     * 
     * // Get first 10 AppSettings
     * const appSettings = await prisma.appSettings.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const appSettingsWithIdOnly = await prisma.appSettings.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AppSettingsFindManyArgs>(args?: SelectSubset<T, AppSettingsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a AppSettings.
     * @param {AppSettingsCreateArgs} args - Arguments to create a AppSettings.
     * @example
     * // Create one AppSettings
     * const AppSettings = await prisma.appSettings.create({
     *   data: {
     *     // ... data to create a AppSettings
     *   }
     * })
     * 
     */
    create<T extends AppSettingsCreateArgs>(args: SelectSubset<T, AppSettingsCreateArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many AppSettings.
     * @param {AppSettingsCreateManyArgs} args - Arguments to create many AppSettings.
     * @example
     * // Create many AppSettings
     * const appSettings = await prisma.appSettings.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AppSettingsCreateManyArgs>(args?: SelectSubset<T, AppSettingsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AppSettings and returns the data saved in the database.
     * @param {AppSettingsCreateManyAndReturnArgs} args - Arguments to create many AppSettings.
     * @example
     * // Create many AppSettings
     * const appSettings = await prisma.appSettings.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AppSettings and only return the `id`
     * const appSettingsWithIdOnly = await prisma.appSettings.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AppSettingsCreateManyAndReturnArgs>(args?: SelectSubset<T, AppSettingsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a AppSettings.
     * @param {AppSettingsDeleteArgs} args - Arguments to delete one AppSettings.
     * @example
     * // Delete one AppSettings
     * const AppSettings = await prisma.appSettings.delete({
     *   where: {
     *     // ... filter to delete one AppSettings
     *   }
     * })
     * 
     */
    delete<T extends AppSettingsDeleteArgs>(args: SelectSubset<T, AppSettingsDeleteArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one AppSettings.
     * @param {AppSettingsUpdateArgs} args - Arguments to update one AppSettings.
     * @example
     * // Update one AppSettings
     * const appSettings = await prisma.appSettings.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AppSettingsUpdateArgs>(args: SelectSubset<T, AppSettingsUpdateArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more AppSettings.
     * @param {AppSettingsDeleteManyArgs} args - Arguments to filter AppSettings to delete.
     * @example
     * // Delete a few AppSettings
     * const { count } = await prisma.appSettings.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AppSettingsDeleteManyArgs>(args?: SelectSubset<T, AppSettingsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AppSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AppSettings
     * const appSettings = await prisma.appSettings.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AppSettingsUpdateManyArgs>(args: SelectSubset<T, AppSettingsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one AppSettings.
     * @param {AppSettingsUpsertArgs} args - Arguments to update or create a AppSettings.
     * @example
     * // Update or create a AppSettings
     * const appSettings = await prisma.appSettings.upsert({
     *   create: {
     *     // ... data to create a AppSettings
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AppSettings we want to update
     *   }
     * })
     */
    upsert<T extends AppSettingsUpsertArgs>(args: SelectSubset<T, AppSettingsUpsertArgs<ExtArgs>>): Prisma__AppSettingsClient<$Result.GetResult<Prisma.$AppSettingsPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of AppSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsCountArgs} args - Arguments to filter AppSettings to count.
     * @example
     * // Count the number of AppSettings
     * const count = await prisma.appSettings.count({
     *   where: {
     *     // ... the filter for the AppSettings we want to count
     *   }
     * })
    **/
    count<T extends AppSettingsCountArgs>(
      args?: Subset<T, AppSettingsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AppSettingsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AppSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends AppSettingsAggregateArgs>(args: Subset<T, AppSettingsAggregateArgs>): Prisma.PrismaPromise<GetAppSettingsAggregateType<T>>

    /**
     * Group by AppSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingsGroupByArgs} args - Group by arguments.
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
      T extends AppSettingsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AppSettingsGroupByArgs['orderBy'] }
        : { orderBy?: AppSettingsGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, AppSettingsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAppSettingsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AppSettings model
   */
  readonly fields: AppSettingsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AppSettings.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AppSettingsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the AppSettings model
   */ 
  interface AppSettingsFieldRefs {
    readonly id: FieldRef<"AppSettings", 'Int'>
    readonly financeEmail: FieldRef<"AppSettings", 'String'>
    readonly appUrl: FieldRef<"AppSettings", 'String'>
    readonly apmUrl: FieldRef<"AppSettings", 'String'>
    readonly apmToken: FieldRef<"AppSettings", 'String'>
    readonly senderName: FieldRef<"AppSettings", 'String'>
    readonly senderEmail: FieldRef<"AppSettings", 'String'>
    readonly filienOrga: FieldRef<"AppSettings", 'String'>
    readonly filienBudget: FieldRef<"AppSettings", 'String'>
    readonly filienExercice: FieldRef<"AppSettings", 'Int'>
    readonly filienAvancement: FieldRef<"AppSettings", 'String'>
    readonly filienRejetDispo: FieldRef<"AppSettings", 'Boolean'>
    readonly filienRejetCA: FieldRef<"AppSettings", 'Boolean'>
    readonly filienRejetMarche: FieldRef<"AppSettings", 'Boolean'>
    readonly filienMouvement: FieldRef<"AppSettings", 'String'>
    readonly filienType: FieldRef<"AppSettings", 'String'>
    readonly filienLibelle: FieldRef<"AppSettings", 'String'>
    readonly filienCalendrier: FieldRef<"AppSettings", 'String'>
    readonly filienMonnaie: FieldRef<"AppSettings", 'String'>
    readonly filienMouvementEx: FieldRef<"AppSettings", 'String'>
    readonly filienPreBordereau: FieldRef<"AppSettings", 'String'>
    readonly filienPoste: FieldRef<"AppSettings", 'String'>
    readonly filienBordereau: FieldRef<"AppSettings", 'String'>
    readonly filienObjet: FieldRef<"AppSettings", 'String'>
    readonly filienChapitre: FieldRef<"AppSettings", 'String'>
    readonly filienNature: FieldRef<"AppSettings", 'String'>
    readonly filienFonction: FieldRef<"AppSettings", 'String'>
    readonly filienCodeInterne: FieldRef<"AppSettings", 'String'>
    readonly filienTypeMouvement: FieldRef<"AppSettings", 'String'>
    readonly filienSens: FieldRef<"AppSettings", 'String'>
    readonly filienStructure: FieldRef<"AppSettings", 'String'>
    readonly filienGestionnaire: FieldRef<"AppSettings", 'String'>
    readonly filienUncPj: FieldRef<"AppSettings", 'String'>
    readonly adDomain: FieldRef<"AppSettings", 'String'>
    readonly signataireRole: FieldRef<"AppSettings", 'String'>
    readonly signataireDelegation: FieldRef<"AppSettings", 'String'>
    readonly signataireNom: FieldRef<"AppSettings", 'String'>
    readonly footer1: FieldRef<"AppSettings", 'String'>
    readonly footer2: FieldRef<"AppSettings", 'String'>
    readonly footer3: FieldRef<"AppSettings", 'String'>
    readonly footerColor: FieldRef<"AppSettings", 'String'>
    readonly updated_at: FieldRef<"AppSettings", 'DateTime'>
    readonly filienUncPass: FieldRef<"AppSettings", 'String'>
    readonly filienUncUser: FieldRef<"AppSettings", 'String'>
    readonly filienUncDomain: FieldRef<"AppSettings", 'String'>
    readonly watermark: FieldRef<"AppSettings", 'String'>
    readonly dbMode: FieldRef<"AppSettings", 'String'>
  }
    

  // Custom InputTypes
  /**
   * AppSettings findUnique
   */
  export type AppSettingsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Filter, which AppSettings to fetch.
     */
    where: AppSettingsWhereUniqueInput
  }

  /**
   * AppSettings findUniqueOrThrow
   */
  export type AppSettingsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Filter, which AppSettings to fetch.
     */
    where: AppSettingsWhereUniqueInput
  }

  /**
   * AppSettings findFirst
   */
  export type AppSettingsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Filter, which AppSettings to fetch.
     */
    where?: AppSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingsOrderByWithRelationInput | AppSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AppSettings.
     */
    cursor?: AppSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AppSettings.
     */
    distinct?: AppSettingsScalarFieldEnum | AppSettingsScalarFieldEnum[]
  }

  /**
   * AppSettings findFirstOrThrow
   */
  export type AppSettingsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Filter, which AppSettings to fetch.
     */
    where?: AppSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingsOrderByWithRelationInput | AppSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AppSettings.
     */
    cursor?: AppSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AppSettings.
     */
    distinct?: AppSettingsScalarFieldEnum | AppSettingsScalarFieldEnum[]
  }

  /**
   * AppSettings findMany
   */
  export type AppSettingsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Filter, which AppSettings to fetch.
     */
    where?: AppSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingsOrderByWithRelationInput | AppSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AppSettings.
     */
    cursor?: AppSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    distinct?: AppSettingsScalarFieldEnum | AppSettingsScalarFieldEnum[]
  }

  /**
   * AppSettings create
   */
  export type AppSettingsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * The data needed to create a AppSettings.
     */
    data: XOR<AppSettingsCreateInput, AppSettingsUncheckedCreateInput>
  }

  /**
   * AppSettings createMany
   */
  export type AppSettingsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AppSettings.
     */
    data: AppSettingsCreateManyInput | AppSettingsCreateManyInput[]
  }

  /**
   * AppSettings createManyAndReturn
   */
  export type AppSettingsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many AppSettings.
     */
    data: AppSettingsCreateManyInput | AppSettingsCreateManyInput[]
  }

  /**
   * AppSettings update
   */
  export type AppSettingsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * The data needed to update a AppSettings.
     */
    data: XOR<AppSettingsUpdateInput, AppSettingsUncheckedUpdateInput>
    /**
     * Choose, which AppSettings to update.
     */
    where: AppSettingsWhereUniqueInput
  }

  /**
   * AppSettings updateMany
   */
  export type AppSettingsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AppSettings.
     */
    data: XOR<AppSettingsUpdateManyMutationInput, AppSettingsUncheckedUpdateManyInput>
    /**
     * Filter which AppSettings to update
     */
    where?: AppSettingsWhereInput
  }

  /**
   * AppSettings upsert
   */
  export type AppSettingsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * The filter to search for the AppSettings to update in case it exists.
     */
    where: AppSettingsWhereUniqueInput
    /**
     * In case the AppSettings found by the `where` argument doesn't exist, create a new AppSettings with this data.
     */
    create: XOR<AppSettingsCreateInput, AppSettingsUncheckedCreateInput>
    /**
     * In case the AppSettings was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AppSettingsUpdateInput, AppSettingsUncheckedUpdateInput>
  }

  /**
   * AppSettings delete
   */
  export type AppSettingsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
    /**
     * Filter which AppSettings to delete.
     */
    where: AppSettingsWhereUniqueInput
  }

  /**
   * AppSettings deleteMany
   */
  export type AppSettingsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AppSettings to delete
     */
    where?: AppSettingsWhereInput
  }

  /**
   * AppSettings without action
   */
  export type AppSettingsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSettings
     */
    select?: AppSettingsSelect<ExtArgs> | null
  }


  /**
   * Model PostgresConfig
   */

  export type AggregatePostgresConfig = {
    _count: PostgresConfigCountAggregateOutputType | null
    _avg: PostgresConfigAvgAggregateOutputType | null
    _sum: PostgresConfigSumAggregateOutputType | null
    _min: PostgresConfigMinAggregateOutputType | null
    _max: PostgresConfigMaxAggregateOutputType | null
  }

  export type PostgresConfigAvgAggregateOutputType = {
    id: number | null
    port: number | null
  }

  export type PostgresConfigSumAggregateOutputType = {
    id: number | null
    port: number | null
  }

  export type PostgresConfigMinAggregateOutputType = {
    id: number | null
    host: string | null
    port: number | null
    database: string | null
    schema: string | null
    schemaDev: string | null
    user: string | null
    password: string | null
  }

  export type PostgresConfigMaxAggregateOutputType = {
    id: number | null
    host: string | null
    port: number | null
    database: string | null
    schema: string | null
    schemaDev: string | null
    user: string | null
    password: string | null
  }

  export type PostgresConfigCountAggregateOutputType = {
    id: number
    host: number
    port: number
    database: number
    schema: number
    schemaDev: number
    user: number
    password: number
    _all: number
  }


  export type PostgresConfigAvgAggregateInputType = {
    id?: true
    port?: true
  }

  export type PostgresConfigSumAggregateInputType = {
    id?: true
    port?: true
  }

  export type PostgresConfigMinAggregateInputType = {
    id?: true
    host?: true
    port?: true
    database?: true
    schema?: true
    schemaDev?: true
    user?: true
    password?: true
  }

  export type PostgresConfigMaxAggregateInputType = {
    id?: true
    host?: true
    port?: true
    database?: true
    schema?: true
    schemaDev?: true
    user?: true
    password?: true
  }

  export type PostgresConfigCountAggregateInputType = {
    id?: true
    host?: true
    port?: true
    database?: true
    schema?: true
    schemaDev?: true
    user?: true
    password?: true
    _all?: true
  }

  export type PostgresConfigAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PostgresConfig to aggregate.
     */
    where?: PostgresConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostgresConfigs to fetch.
     */
    orderBy?: PostgresConfigOrderByWithRelationInput | PostgresConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PostgresConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostgresConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostgresConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PostgresConfigs
    **/
    _count?: true | PostgresConfigCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PostgresConfigAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PostgresConfigSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PostgresConfigMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PostgresConfigMaxAggregateInputType
  }

  export type GetPostgresConfigAggregateType<T extends PostgresConfigAggregateArgs> = {
        [P in keyof T & keyof AggregatePostgresConfig]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePostgresConfig[P]>
      : GetScalarType<T[P], AggregatePostgresConfig[P]>
  }




  export type PostgresConfigGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostgresConfigWhereInput
    orderBy?: PostgresConfigOrderByWithAggregationInput | PostgresConfigOrderByWithAggregationInput[]
    by: PostgresConfigScalarFieldEnum[] | PostgresConfigScalarFieldEnum
    having?: PostgresConfigScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PostgresConfigCountAggregateInputType | true
    _avg?: PostgresConfigAvgAggregateInputType
    _sum?: PostgresConfigSumAggregateInputType
    _min?: PostgresConfigMinAggregateInputType
    _max?: PostgresConfigMaxAggregateInputType
  }

  export type PostgresConfigGroupByOutputType = {
    id: number
    host: string
    port: number
    database: string
    schema: string
    schemaDev: string
    user: string
    password: string
    _count: PostgresConfigCountAggregateOutputType | null
    _avg: PostgresConfigAvgAggregateOutputType | null
    _sum: PostgresConfigSumAggregateOutputType | null
    _min: PostgresConfigMinAggregateOutputType | null
    _max: PostgresConfigMaxAggregateOutputType | null
  }

  type GetPostgresConfigGroupByPayload<T extends PostgresConfigGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PostgresConfigGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PostgresConfigGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PostgresConfigGroupByOutputType[P]>
            : GetScalarType<T[P], PostgresConfigGroupByOutputType[P]>
        }
      >
    >


  export type PostgresConfigSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    host?: boolean
    port?: boolean
    database?: boolean
    schema?: boolean
    schemaDev?: boolean
    user?: boolean
    password?: boolean
  }, ExtArgs["result"]["postgresConfig"]>

  export type PostgresConfigSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    host?: boolean
    port?: boolean
    database?: boolean
    schema?: boolean
    schemaDev?: boolean
    user?: boolean
    password?: boolean
  }, ExtArgs["result"]["postgresConfig"]>

  export type PostgresConfigSelectScalar = {
    id?: boolean
    host?: boolean
    port?: boolean
    database?: boolean
    schema?: boolean
    schemaDev?: boolean
    user?: boolean
    password?: boolean
  }


  export type $PostgresConfigPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PostgresConfig"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      host: string
      port: number
      database: string
      schema: string
      schemaDev: string
      user: string
      password: string
    }, ExtArgs["result"]["postgresConfig"]>
    composites: {}
  }

  type PostgresConfigGetPayload<S extends boolean | null | undefined | PostgresConfigDefaultArgs> = $Result.GetResult<Prisma.$PostgresConfigPayload, S>

  type PostgresConfigCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PostgresConfigFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PostgresConfigCountAggregateInputType | true
    }

  export interface PostgresConfigDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PostgresConfig'], meta: { name: 'PostgresConfig' } }
    /**
     * Find zero or one PostgresConfig that matches the filter.
     * @param {PostgresConfigFindUniqueArgs} args - Arguments to find a PostgresConfig
     * @example
     * // Get one PostgresConfig
     * const postgresConfig = await prisma.postgresConfig.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PostgresConfigFindUniqueArgs>(args: SelectSubset<T, PostgresConfigFindUniqueArgs<ExtArgs>>): Prisma__PostgresConfigClient<$Result.GetResult<Prisma.$PostgresConfigPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PostgresConfig that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PostgresConfigFindUniqueOrThrowArgs} args - Arguments to find a PostgresConfig
     * @example
     * // Get one PostgresConfig
     * const postgresConfig = await prisma.postgresConfig.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PostgresConfigFindUniqueOrThrowArgs>(args: SelectSubset<T, PostgresConfigFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PostgresConfigClient<$Result.GetResult<Prisma.$PostgresConfigPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PostgresConfig that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostgresConfigFindFirstArgs} args - Arguments to find a PostgresConfig
     * @example
     * // Get one PostgresConfig
     * const postgresConfig = await prisma.postgresConfig.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PostgresConfigFindFirstArgs>(args?: SelectSubset<T, PostgresConfigFindFirstArgs<ExtArgs>>): Prisma__PostgresConfigClient<$Result.GetResult<Prisma.$PostgresConfigPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PostgresConfig that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostgresConfigFindFirstOrThrowArgs} args - Arguments to find a PostgresConfig
     * @example
     * // Get one PostgresConfig
     * const postgresConfig = await prisma.postgresConfig.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PostgresConfigFindFirstOrThrowArgs>(args?: SelectSubset<T, PostgresConfigFindFirstOrThrowArgs<ExtArgs>>): Prisma__PostgresConfigClient<$Result.GetResult<Prisma.$PostgresConfigPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PostgresConfigs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostgresConfigFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PostgresConfigs
     * const postgresConfigs = await prisma.postgresConfig.findMany()
     * 
     * // Get first 10 PostgresConfigs
     * const postgresConfigs = await prisma.postgresConfig.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const postgresConfigWithIdOnly = await prisma.postgresConfig.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PostgresConfigFindManyArgs>(args?: SelectSubset<T, PostgresConfigFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostgresConfigPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PostgresConfig.
     * @param {PostgresConfigCreateArgs} args - Arguments to create a PostgresConfig.
     * @example
     * // Create one PostgresConfig
     * const PostgresConfig = await prisma.postgresConfig.create({
     *   data: {
     *     // ... data to create a PostgresConfig
     *   }
     * })
     * 
     */
    create<T extends PostgresConfigCreateArgs>(args: SelectSubset<T, PostgresConfigCreateArgs<ExtArgs>>): Prisma__PostgresConfigClient<$Result.GetResult<Prisma.$PostgresConfigPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PostgresConfigs.
     * @param {PostgresConfigCreateManyArgs} args - Arguments to create many PostgresConfigs.
     * @example
     * // Create many PostgresConfigs
     * const postgresConfig = await prisma.postgresConfig.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PostgresConfigCreateManyArgs>(args?: SelectSubset<T, PostgresConfigCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PostgresConfigs and returns the data saved in the database.
     * @param {PostgresConfigCreateManyAndReturnArgs} args - Arguments to create many PostgresConfigs.
     * @example
     * // Create many PostgresConfigs
     * const postgresConfig = await prisma.postgresConfig.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PostgresConfigs and only return the `id`
     * const postgresConfigWithIdOnly = await prisma.postgresConfig.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PostgresConfigCreateManyAndReturnArgs>(args?: SelectSubset<T, PostgresConfigCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostgresConfigPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PostgresConfig.
     * @param {PostgresConfigDeleteArgs} args - Arguments to delete one PostgresConfig.
     * @example
     * // Delete one PostgresConfig
     * const PostgresConfig = await prisma.postgresConfig.delete({
     *   where: {
     *     // ... filter to delete one PostgresConfig
     *   }
     * })
     * 
     */
    delete<T extends PostgresConfigDeleteArgs>(args: SelectSubset<T, PostgresConfigDeleteArgs<ExtArgs>>): Prisma__PostgresConfigClient<$Result.GetResult<Prisma.$PostgresConfigPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PostgresConfig.
     * @param {PostgresConfigUpdateArgs} args - Arguments to update one PostgresConfig.
     * @example
     * // Update one PostgresConfig
     * const postgresConfig = await prisma.postgresConfig.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PostgresConfigUpdateArgs>(args: SelectSubset<T, PostgresConfigUpdateArgs<ExtArgs>>): Prisma__PostgresConfigClient<$Result.GetResult<Prisma.$PostgresConfigPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PostgresConfigs.
     * @param {PostgresConfigDeleteManyArgs} args - Arguments to filter PostgresConfigs to delete.
     * @example
     * // Delete a few PostgresConfigs
     * const { count } = await prisma.postgresConfig.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PostgresConfigDeleteManyArgs>(args?: SelectSubset<T, PostgresConfigDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PostgresConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostgresConfigUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PostgresConfigs
     * const postgresConfig = await prisma.postgresConfig.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PostgresConfigUpdateManyArgs>(args: SelectSubset<T, PostgresConfigUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PostgresConfig.
     * @param {PostgresConfigUpsertArgs} args - Arguments to update or create a PostgresConfig.
     * @example
     * // Update or create a PostgresConfig
     * const postgresConfig = await prisma.postgresConfig.upsert({
     *   create: {
     *     // ... data to create a PostgresConfig
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PostgresConfig we want to update
     *   }
     * })
     */
    upsert<T extends PostgresConfigUpsertArgs>(args: SelectSubset<T, PostgresConfigUpsertArgs<ExtArgs>>): Prisma__PostgresConfigClient<$Result.GetResult<Prisma.$PostgresConfigPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PostgresConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostgresConfigCountArgs} args - Arguments to filter PostgresConfigs to count.
     * @example
     * // Count the number of PostgresConfigs
     * const count = await prisma.postgresConfig.count({
     *   where: {
     *     // ... the filter for the PostgresConfigs we want to count
     *   }
     * })
    **/
    count<T extends PostgresConfigCountArgs>(
      args?: Subset<T, PostgresConfigCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PostgresConfigCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PostgresConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostgresConfigAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PostgresConfigAggregateArgs>(args: Subset<T, PostgresConfigAggregateArgs>): Prisma.PrismaPromise<GetPostgresConfigAggregateType<T>>

    /**
     * Group by PostgresConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostgresConfigGroupByArgs} args - Group by arguments.
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
      T extends PostgresConfigGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PostgresConfigGroupByArgs['orderBy'] }
        : { orderBy?: PostgresConfigGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PostgresConfigGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostgresConfigGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PostgresConfig model
   */
  readonly fields: PostgresConfigFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PostgresConfig.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PostgresConfigClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the PostgresConfig model
   */ 
  interface PostgresConfigFieldRefs {
    readonly id: FieldRef<"PostgresConfig", 'Int'>
    readonly host: FieldRef<"PostgresConfig", 'String'>
    readonly port: FieldRef<"PostgresConfig", 'Int'>
    readonly database: FieldRef<"PostgresConfig", 'String'>
    readonly schema: FieldRef<"PostgresConfig", 'String'>
    readonly schemaDev: FieldRef<"PostgresConfig", 'String'>
    readonly user: FieldRef<"PostgresConfig", 'String'>
    readonly password: FieldRef<"PostgresConfig", 'String'>
  }
    

  // Custom InputTypes
  /**
   * PostgresConfig findUnique
   */
  export type PostgresConfigFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostgresConfig
     */
    select?: PostgresConfigSelect<ExtArgs> | null
    /**
     * Filter, which PostgresConfig to fetch.
     */
    where: PostgresConfigWhereUniqueInput
  }

  /**
   * PostgresConfig findUniqueOrThrow
   */
  export type PostgresConfigFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostgresConfig
     */
    select?: PostgresConfigSelect<ExtArgs> | null
    /**
     * Filter, which PostgresConfig to fetch.
     */
    where: PostgresConfigWhereUniqueInput
  }

  /**
   * PostgresConfig findFirst
   */
  export type PostgresConfigFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostgresConfig
     */
    select?: PostgresConfigSelect<ExtArgs> | null
    /**
     * Filter, which PostgresConfig to fetch.
     */
    where?: PostgresConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostgresConfigs to fetch.
     */
    orderBy?: PostgresConfigOrderByWithRelationInput | PostgresConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PostgresConfigs.
     */
    cursor?: PostgresConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostgresConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostgresConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PostgresConfigs.
     */
    distinct?: PostgresConfigScalarFieldEnum | PostgresConfigScalarFieldEnum[]
  }

  /**
   * PostgresConfig findFirstOrThrow
   */
  export type PostgresConfigFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostgresConfig
     */
    select?: PostgresConfigSelect<ExtArgs> | null
    /**
     * Filter, which PostgresConfig to fetch.
     */
    where?: PostgresConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostgresConfigs to fetch.
     */
    orderBy?: PostgresConfigOrderByWithRelationInput | PostgresConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PostgresConfigs.
     */
    cursor?: PostgresConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostgresConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostgresConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PostgresConfigs.
     */
    distinct?: PostgresConfigScalarFieldEnum | PostgresConfigScalarFieldEnum[]
  }

  /**
   * PostgresConfig findMany
   */
  export type PostgresConfigFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostgresConfig
     */
    select?: PostgresConfigSelect<ExtArgs> | null
    /**
     * Filter, which PostgresConfigs to fetch.
     */
    where?: PostgresConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostgresConfigs to fetch.
     */
    orderBy?: PostgresConfigOrderByWithRelationInput | PostgresConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PostgresConfigs.
     */
    cursor?: PostgresConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostgresConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostgresConfigs.
     */
    skip?: number
    distinct?: PostgresConfigScalarFieldEnum | PostgresConfigScalarFieldEnum[]
  }

  /**
   * PostgresConfig create
   */
  export type PostgresConfigCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostgresConfig
     */
    select?: PostgresConfigSelect<ExtArgs> | null
    /**
     * The data needed to create a PostgresConfig.
     */
    data: XOR<PostgresConfigCreateInput, PostgresConfigUncheckedCreateInput>
  }

  /**
   * PostgresConfig createMany
   */
  export type PostgresConfigCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PostgresConfigs.
     */
    data: PostgresConfigCreateManyInput | PostgresConfigCreateManyInput[]
  }

  /**
   * PostgresConfig createManyAndReturn
   */
  export type PostgresConfigCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostgresConfig
     */
    select?: PostgresConfigSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PostgresConfigs.
     */
    data: PostgresConfigCreateManyInput | PostgresConfigCreateManyInput[]
  }

  /**
   * PostgresConfig update
   */
  export type PostgresConfigUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostgresConfig
     */
    select?: PostgresConfigSelect<ExtArgs> | null
    /**
     * The data needed to update a PostgresConfig.
     */
    data: XOR<PostgresConfigUpdateInput, PostgresConfigUncheckedUpdateInput>
    /**
     * Choose, which PostgresConfig to update.
     */
    where: PostgresConfigWhereUniqueInput
  }

  /**
   * PostgresConfig updateMany
   */
  export type PostgresConfigUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PostgresConfigs.
     */
    data: XOR<PostgresConfigUpdateManyMutationInput, PostgresConfigUncheckedUpdateManyInput>
    /**
     * Filter which PostgresConfigs to update
     */
    where?: PostgresConfigWhereInput
  }

  /**
   * PostgresConfig upsert
   */
  export type PostgresConfigUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostgresConfig
     */
    select?: PostgresConfigSelect<ExtArgs> | null
    /**
     * The filter to search for the PostgresConfig to update in case it exists.
     */
    where: PostgresConfigWhereUniqueInput
    /**
     * In case the PostgresConfig found by the `where` argument doesn't exist, create a new PostgresConfig with this data.
     */
    create: XOR<PostgresConfigCreateInput, PostgresConfigUncheckedCreateInput>
    /**
     * In case the PostgresConfig was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PostgresConfigUpdateInput, PostgresConfigUncheckedUpdateInput>
  }

  /**
   * PostgresConfig delete
   */
  export type PostgresConfigDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostgresConfig
     */
    select?: PostgresConfigSelect<ExtArgs> | null
    /**
     * Filter which PostgresConfig to delete.
     */
    where: PostgresConfigWhereUniqueInput
  }

  /**
   * PostgresConfig deleteMany
   */
  export type PostgresConfigDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PostgresConfigs to delete
     */
    where?: PostgresConfigWhereInput
  }

  /**
   * PostgresConfig without action
   */
  export type PostgresConfigDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostgresConfig
     */
    select?: PostgresConfigSelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const AppSettingsScalarFieldEnum: {
    id: 'id',
    financeEmail: 'financeEmail',
    appUrl: 'appUrl',
    apmUrl: 'apmUrl',
    apmToken: 'apmToken',
    senderName: 'senderName',
    senderEmail: 'senderEmail',
    filienOrga: 'filienOrga',
    filienBudget: 'filienBudget',
    filienExercice: 'filienExercice',
    filienAvancement: 'filienAvancement',
    filienRejetDispo: 'filienRejetDispo',
    filienRejetCA: 'filienRejetCA',
    filienRejetMarche: 'filienRejetMarche',
    filienMouvement: 'filienMouvement',
    filienType: 'filienType',
    filienLibelle: 'filienLibelle',
    filienCalendrier: 'filienCalendrier',
    filienMonnaie: 'filienMonnaie',
    filienMouvementEx: 'filienMouvementEx',
    filienPreBordereau: 'filienPreBordereau',
    filienPoste: 'filienPoste',
    filienBordereau: 'filienBordereau',
    filienObjet: 'filienObjet',
    filienChapitre: 'filienChapitre',
    filienNature: 'filienNature',
    filienFonction: 'filienFonction',
    filienCodeInterne: 'filienCodeInterne',
    filienTypeMouvement: 'filienTypeMouvement',
    filienSens: 'filienSens',
    filienStructure: 'filienStructure',
    filienGestionnaire: 'filienGestionnaire',
    filienUncPj: 'filienUncPj',
    adDomain: 'adDomain',
    signataireRole: 'signataireRole',
    signataireDelegation: 'signataireDelegation',
    signataireNom: 'signataireNom',
    footer1: 'footer1',
    footer2: 'footer2',
    footer3: 'footer3',
    footerColor: 'footerColor',
    updated_at: 'updated_at',
    filienUncPass: 'filienUncPass',
    filienUncUser: 'filienUncUser',
    filienUncDomain: 'filienUncDomain',
    watermark: 'watermark',
    dbMode: 'dbMode'
  };

  export type AppSettingsScalarFieldEnum = (typeof AppSettingsScalarFieldEnum)[keyof typeof AppSettingsScalarFieldEnum]


  export const PostgresConfigScalarFieldEnum: {
    id: 'id',
    host: 'host',
    port: 'port',
    database: 'database',
    schema: 'schema',
    schemaDev: 'schemaDev',
    user: 'user',
    password: 'password'
  };

  export type PostgresConfigScalarFieldEnum = (typeof PostgresConfigScalarFieldEnum)[keyof typeof PostgresConfigScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


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
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type AppSettingsWhereInput = {
    AND?: AppSettingsWhereInput | AppSettingsWhereInput[]
    OR?: AppSettingsWhereInput[]
    NOT?: AppSettingsWhereInput | AppSettingsWhereInput[]
    id?: IntFilter<"AppSettings"> | number
    financeEmail?: StringNullableFilter<"AppSettings"> | string | null
    appUrl?: StringNullableFilter<"AppSettings"> | string | null
    apmUrl?: StringNullableFilter<"AppSettings"> | string | null
    apmToken?: StringNullableFilter<"AppSettings"> | string | null
    senderName?: StringNullableFilter<"AppSettings"> | string | null
    senderEmail?: StringNullableFilter<"AppSettings"> | string | null
    filienOrga?: StringNullableFilter<"AppSettings"> | string | null
    filienBudget?: StringNullableFilter<"AppSettings"> | string | null
    filienExercice?: IntNullableFilter<"AppSettings"> | number | null
    filienAvancement?: StringNullableFilter<"AppSettings"> | string | null
    filienRejetDispo?: BoolNullableFilter<"AppSettings"> | boolean | null
    filienRejetCA?: BoolNullableFilter<"AppSettings"> | boolean | null
    filienRejetMarche?: BoolNullableFilter<"AppSettings"> | boolean | null
    filienMouvement?: StringNullableFilter<"AppSettings"> | string | null
    filienType?: StringNullableFilter<"AppSettings"> | string | null
    filienLibelle?: StringNullableFilter<"AppSettings"> | string | null
    filienCalendrier?: StringNullableFilter<"AppSettings"> | string | null
    filienMonnaie?: StringNullableFilter<"AppSettings"> | string | null
    filienMouvementEx?: StringNullableFilter<"AppSettings"> | string | null
    filienPreBordereau?: StringNullableFilter<"AppSettings"> | string | null
    filienPoste?: StringNullableFilter<"AppSettings"> | string | null
    filienBordereau?: StringNullableFilter<"AppSettings"> | string | null
    filienObjet?: StringNullableFilter<"AppSettings"> | string | null
    filienChapitre?: StringNullableFilter<"AppSettings"> | string | null
    filienNature?: StringNullableFilter<"AppSettings"> | string | null
    filienFonction?: StringNullableFilter<"AppSettings"> | string | null
    filienCodeInterne?: StringNullableFilter<"AppSettings"> | string | null
    filienTypeMouvement?: StringNullableFilter<"AppSettings"> | string | null
    filienSens?: StringNullableFilter<"AppSettings"> | string | null
    filienStructure?: StringNullableFilter<"AppSettings"> | string | null
    filienGestionnaire?: StringNullableFilter<"AppSettings"> | string | null
    filienUncPj?: StringNullableFilter<"AppSettings"> | string | null
    adDomain?: StringNullableFilter<"AppSettings"> | string | null
    signataireRole?: StringNullableFilter<"AppSettings"> | string | null
    signataireDelegation?: StringNullableFilter<"AppSettings"> | string | null
    signataireNom?: StringNullableFilter<"AppSettings"> | string | null
    footer1?: StringNullableFilter<"AppSettings"> | string | null
    footer2?: StringNullableFilter<"AppSettings"> | string | null
    footer3?: StringNullableFilter<"AppSettings"> | string | null
    footerColor?: StringNullableFilter<"AppSettings"> | string | null
    updated_at?: DateTimeFilter<"AppSettings"> | Date | string
    filienUncPass?: StringNullableFilter<"AppSettings"> | string | null
    filienUncUser?: StringNullableFilter<"AppSettings"> | string | null
    filienUncDomain?: StringNullableFilter<"AppSettings"> | string | null
    watermark?: StringNullableFilter<"AppSettings"> | string | null
    dbMode?: StringFilter<"AppSettings"> | string
  }

  export type AppSettingsOrderByWithRelationInput = {
    id?: SortOrder
    financeEmail?: SortOrderInput | SortOrder
    appUrl?: SortOrderInput | SortOrder
    apmUrl?: SortOrderInput | SortOrder
    apmToken?: SortOrderInput | SortOrder
    senderName?: SortOrderInput | SortOrder
    senderEmail?: SortOrderInput | SortOrder
    filienOrga?: SortOrderInput | SortOrder
    filienBudget?: SortOrderInput | SortOrder
    filienExercice?: SortOrderInput | SortOrder
    filienAvancement?: SortOrderInput | SortOrder
    filienRejetDispo?: SortOrderInput | SortOrder
    filienRejetCA?: SortOrderInput | SortOrder
    filienRejetMarche?: SortOrderInput | SortOrder
    filienMouvement?: SortOrderInput | SortOrder
    filienType?: SortOrderInput | SortOrder
    filienLibelle?: SortOrderInput | SortOrder
    filienCalendrier?: SortOrderInput | SortOrder
    filienMonnaie?: SortOrderInput | SortOrder
    filienMouvementEx?: SortOrderInput | SortOrder
    filienPreBordereau?: SortOrderInput | SortOrder
    filienPoste?: SortOrderInput | SortOrder
    filienBordereau?: SortOrderInput | SortOrder
    filienObjet?: SortOrderInput | SortOrder
    filienChapitre?: SortOrderInput | SortOrder
    filienNature?: SortOrderInput | SortOrder
    filienFonction?: SortOrderInput | SortOrder
    filienCodeInterne?: SortOrderInput | SortOrder
    filienTypeMouvement?: SortOrderInput | SortOrder
    filienSens?: SortOrderInput | SortOrder
    filienStructure?: SortOrderInput | SortOrder
    filienGestionnaire?: SortOrderInput | SortOrder
    filienUncPj?: SortOrderInput | SortOrder
    adDomain?: SortOrderInput | SortOrder
    signataireRole?: SortOrderInput | SortOrder
    signataireDelegation?: SortOrderInput | SortOrder
    signataireNom?: SortOrderInput | SortOrder
    footer1?: SortOrderInput | SortOrder
    footer2?: SortOrderInput | SortOrder
    footer3?: SortOrderInput | SortOrder
    footerColor?: SortOrderInput | SortOrder
    updated_at?: SortOrder
    filienUncPass?: SortOrderInput | SortOrder
    filienUncUser?: SortOrderInput | SortOrder
    filienUncDomain?: SortOrderInput | SortOrder
    watermark?: SortOrderInput | SortOrder
    dbMode?: SortOrder
  }

  export type AppSettingsWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: AppSettingsWhereInput | AppSettingsWhereInput[]
    OR?: AppSettingsWhereInput[]
    NOT?: AppSettingsWhereInput | AppSettingsWhereInput[]
    financeEmail?: StringNullableFilter<"AppSettings"> | string | null
    appUrl?: StringNullableFilter<"AppSettings"> | string | null
    apmUrl?: StringNullableFilter<"AppSettings"> | string | null
    apmToken?: StringNullableFilter<"AppSettings"> | string | null
    senderName?: StringNullableFilter<"AppSettings"> | string | null
    senderEmail?: StringNullableFilter<"AppSettings"> | string | null
    filienOrga?: StringNullableFilter<"AppSettings"> | string | null
    filienBudget?: StringNullableFilter<"AppSettings"> | string | null
    filienExercice?: IntNullableFilter<"AppSettings"> | number | null
    filienAvancement?: StringNullableFilter<"AppSettings"> | string | null
    filienRejetDispo?: BoolNullableFilter<"AppSettings"> | boolean | null
    filienRejetCA?: BoolNullableFilter<"AppSettings"> | boolean | null
    filienRejetMarche?: BoolNullableFilter<"AppSettings"> | boolean | null
    filienMouvement?: StringNullableFilter<"AppSettings"> | string | null
    filienType?: StringNullableFilter<"AppSettings"> | string | null
    filienLibelle?: StringNullableFilter<"AppSettings"> | string | null
    filienCalendrier?: StringNullableFilter<"AppSettings"> | string | null
    filienMonnaie?: StringNullableFilter<"AppSettings"> | string | null
    filienMouvementEx?: StringNullableFilter<"AppSettings"> | string | null
    filienPreBordereau?: StringNullableFilter<"AppSettings"> | string | null
    filienPoste?: StringNullableFilter<"AppSettings"> | string | null
    filienBordereau?: StringNullableFilter<"AppSettings"> | string | null
    filienObjet?: StringNullableFilter<"AppSettings"> | string | null
    filienChapitre?: StringNullableFilter<"AppSettings"> | string | null
    filienNature?: StringNullableFilter<"AppSettings"> | string | null
    filienFonction?: StringNullableFilter<"AppSettings"> | string | null
    filienCodeInterne?: StringNullableFilter<"AppSettings"> | string | null
    filienTypeMouvement?: StringNullableFilter<"AppSettings"> | string | null
    filienSens?: StringNullableFilter<"AppSettings"> | string | null
    filienStructure?: StringNullableFilter<"AppSettings"> | string | null
    filienGestionnaire?: StringNullableFilter<"AppSettings"> | string | null
    filienUncPj?: StringNullableFilter<"AppSettings"> | string | null
    adDomain?: StringNullableFilter<"AppSettings"> | string | null
    signataireRole?: StringNullableFilter<"AppSettings"> | string | null
    signataireDelegation?: StringNullableFilter<"AppSettings"> | string | null
    signataireNom?: StringNullableFilter<"AppSettings"> | string | null
    footer1?: StringNullableFilter<"AppSettings"> | string | null
    footer2?: StringNullableFilter<"AppSettings"> | string | null
    footer3?: StringNullableFilter<"AppSettings"> | string | null
    footerColor?: StringNullableFilter<"AppSettings"> | string | null
    updated_at?: DateTimeFilter<"AppSettings"> | Date | string
    filienUncPass?: StringNullableFilter<"AppSettings"> | string | null
    filienUncUser?: StringNullableFilter<"AppSettings"> | string | null
    filienUncDomain?: StringNullableFilter<"AppSettings"> | string | null
    watermark?: StringNullableFilter<"AppSettings"> | string | null
    dbMode?: StringFilter<"AppSettings"> | string
  }, "id">

  export type AppSettingsOrderByWithAggregationInput = {
    id?: SortOrder
    financeEmail?: SortOrderInput | SortOrder
    appUrl?: SortOrderInput | SortOrder
    apmUrl?: SortOrderInput | SortOrder
    apmToken?: SortOrderInput | SortOrder
    senderName?: SortOrderInput | SortOrder
    senderEmail?: SortOrderInput | SortOrder
    filienOrga?: SortOrderInput | SortOrder
    filienBudget?: SortOrderInput | SortOrder
    filienExercice?: SortOrderInput | SortOrder
    filienAvancement?: SortOrderInput | SortOrder
    filienRejetDispo?: SortOrderInput | SortOrder
    filienRejetCA?: SortOrderInput | SortOrder
    filienRejetMarche?: SortOrderInput | SortOrder
    filienMouvement?: SortOrderInput | SortOrder
    filienType?: SortOrderInput | SortOrder
    filienLibelle?: SortOrderInput | SortOrder
    filienCalendrier?: SortOrderInput | SortOrder
    filienMonnaie?: SortOrderInput | SortOrder
    filienMouvementEx?: SortOrderInput | SortOrder
    filienPreBordereau?: SortOrderInput | SortOrder
    filienPoste?: SortOrderInput | SortOrder
    filienBordereau?: SortOrderInput | SortOrder
    filienObjet?: SortOrderInput | SortOrder
    filienChapitre?: SortOrderInput | SortOrder
    filienNature?: SortOrderInput | SortOrder
    filienFonction?: SortOrderInput | SortOrder
    filienCodeInterne?: SortOrderInput | SortOrder
    filienTypeMouvement?: SortOrderInput | SortOrder
    filienSens?: SortOrderInput | SortOrder
    filienStructure?: SortOrderInput | SortOrder
    filienGestionnaire?: SortOrderInput | SortOrder
    filienUncPj?: SortOrderInput | SortOrder
    adDomain?: SortOrderInput | SortOrder
    signataireRole?: SortOrderInput | SortOrder
    signataireDelegation?: SortOrderInput | SortOrder
    signataireNom?: SortOrderInput | SortOrder
    footer1?: SortOrderInput | SortOrder
    footer2?: SortOrderInput | SortOrder
    footer3?: SortOrderInput | SortOrder
    footerColor?: SortOrderInput | SortOrder
    updated_at?: SortOrder
    filienUncPass?: SortOrderInput | SortOrder
    filienUncUser?: SortOrderInput | SortOrder
    filienUncDomain?: SortOrderInput | SortOrder
    watermark?: SortOrderInput | SortOrder
    dbMode?: SortOrder
    _count?: AppSettingsCountOrderByAggregateInput
    _avg?: AppSettingsAvgOrderByAggregateInput
    _max?: AppSettingsMaxOrderByAggregateInput
    _min?: AppSettingsMinOrderByAggregateInput
    _sum?: AppSettingsSumOrderByAggregateInput
  }

  export type AppSettingsScalarWhereWithAggregatesInput = {
    AND?: AppSettingsScalarWhereWithAggregatesInput | AppSettingsScalarWhereWithAggregatesInput[]
    OR?: AppSettingsScalarWhereWithAggregatesInput[]
    NOT?: AppSettingsScalarWhereWithAggregatesInput | AppSettingsScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"AppSettings"> | number
    financeEmail?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    appUrl?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    apmUrl?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    apmToken?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    senderName?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    senderEmail?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienOrga?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienBudget?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienExercice?: IntNullableWithAggregatesFilter<"AppSettings"> | number | null
    filienAvancement?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienRejetDispo?: BoolNullableWithAggregatesFilter<"AppSettings"> | boolean | null
    filienRejetCA?: BoolNullableWithAggregatesFilter<"AppSettings"> | boolean | null
    filienRejetMarche?: BoolNullableWithAggregatesFilter<"AppSettings"> | boolean | null
    filienMouvement?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienType?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienLibelle?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienCalendrier?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienMonnaie?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienMouvementEx?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienPreBordereau?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienPoste?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienBordereau?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienObjet?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienChapitre?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienNature?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienFonction?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienCodeInterne?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienTypeMouvement?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienSens?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienStructure?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienGestionnaire?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienUncPj?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    adDomain?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    signataireRole?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    signataireDelegation?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    signataireNom?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    footer1?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    footer2?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    footer3?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    footerColor?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    updated_at?: DateTimeWithAggregatesFilter<"AppSettings"> | Date | string
    filienUncPass?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienUncUser?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    filienUncDomain?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    watermark?: StringNullableWithAggregatesFilter<"AppSettings"> | string | null
    dbMode?: StringWithAggregatesFilter<"AppSettings"> | string
  }

  export type PostgresConfigWhereInput = {
    AND?: PostgresConfigWhereInput | PostgresConfigWhereInput[]
    OR?: PostgresConfigWhereInput[]
    NOT?: PostgresConfigWhereInput | PostgresConfigWhereInput[]
    id?: IntFilter<"PostgresConfig"> | number
    host?: StringFilter<"PostgresConfig"> | string
    port?: IntFilter<"PostgresConfig"> | number
    database?: StringFilter<"PostgresConfig"> | string
    schema?: StringFilter<"PostgresConfig"> | string
    schemaDev?: StringFilter<"PostgresConfig"> | string
    user?: StringFilter<"PostgresConfig"> | string
    password?: StringFilter<"PostgresConfig"> | string
  }

  export type PostgresConfigOrderByWithRelationInput = {
    id?: SortOrder
    host?: SortOrder
    port?: SortOrder
    database?: SortOrder
    schema?: SortOrder
    schemaDev?: SortOrder
    user?: SortOrder
    password?: SortOrder
  }

  export type PostgresConfigWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: PostgresConfigWhereInput | PostgresConfigWhereInput[]
    OR?: PostgresConfigWhereInput[]
    NOT?: PostgresConfigWhereInput | PostgresConfigWhereInput[]
    host?: StringFilter<"PostgresConfig"> | string
    port?: IntFilter<"PostgresConfig"> | number
    database?: StringFilter<"PostgresConfig"> | string
    schema?: StringFilter<"PostgresConfig"> | string
    schemaDev?: StringFilter<"PostgresConfig"> | string
    user?: StringFilter<"PostgresConfig"> | string
    password?: StringFilter<"PostgresConfig"> | string
  }, "id">

  export type PostgresConfigOrderByWithAggregationInput = {
    id?: SortOrder
    host?: SortOrder
    port?: SortOrder
    database?: SortOrder
    schema?: SortOrder
    schemaDev?: SortOrder
    user?: SortOrder
    password?: SortOrder
    _count?: PostgresConfigCountOrderByAggregateInput
    _avg?: PostgresConfigAvgOrderByAggregateInput
    _max?: PostgresConfigMaxOrderByAggregateInput
    _min?: PostgresConfigMinOrderByAggregateInput
    _sum?: PostgresConfigSumOrderByAggregateInput
  }

  export type PostgresConfigScalarWhereWithAggregatesInput = {
    AND?: PostgresConfigScalarWhereWithAggregatesInput | PostgresConfigScalarWhereWithAggregatesInput[]
    OR?: PostgresConfigScalarWhereWithAggregatesInput[]
    NOT?: PostgresConfigScalarWhereWithAggregatesInput | PostgresConfigScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"PostgresConfig"> | number
    host?: StringWithAggregatesFilter<"PostgresConfig"> | string
    port?: IntWithAggregatesFilter<"PostgresConfig"> | number
    database?: StringWithAggregatesFilter<"PostgresConfig"> | string
    schema?: StringWithAggregatesFilter<"PostgresConfig"> | string
    schemaDev?: StringWithAggregatesFilter<"PostgresConfig"> | string
    user?: StringWithAggregatesFilter<"PostgresConfig"> | string
    password?: StringWithAggregatesFilter<"PostgresConfig"> | string
  }

  export type AppSettingsCreateInput = {
    financeEmail?: string | null
    appUrl?: string | null
    apmUrl?: string | null
    apmToken?: string | null
    senderName?: string | null
    senderEmail?: string | null
    filienOrga?: string | null
    filienBudget?: string | null
    filienExercice?: number | null
    filienAvancement?: string | null
    filienRejetDispo?: boolean | null
    filienRejetCA?: boolean | null
    filienRejetMarche?: boolean | null
    filienMouvement?: string | null
    filienType?: string | null
    filienLibelle?: string | null
    filienCalendrier?: string | null
    filienMonnaie?: string | null
    filienMouvementEx?: string | null
    filienPreBordereau?: string | null
    filienPoste?: string | null
    filienBordereau?: string | null
    filienObjet?: string | null
    filienChapitre?: string | null
    filienNature?: string | null
    filienFonction?: string | null
    filienCodeInterne?: string | null
    filienTypeMouvement?: string | null
    filienSens?: string | null
    filienStructure?: string | null
    filienGestionnaire?: string | null
    filienUncPj?: string | null
    adDomain?: string | null
    signataireRole?: string | null
    signataireDelegation?: string | null
    signataireNom?: string | null
    footer1?: string | null
    footer2?: string | null
    footer3?: string | null
    footerColor?: string | null
    updated_at?: Date | string
    filienUncPass?: string | null
    filienUncUser?: string | null
    filienUncDomain?: string | null
    watermark?: string | null
    dbMode?: string
  }

  export type AppSettingsUncheckedCreateInput = {
    id?: number
    financeEmail?: string | null
    appUrl?: string | null
    apmUrl?: string | null
    apmToken?: string | null
    senderName?: string | null
    senderEmail?: string | null
    filienOrga?: string | null
    filienBudget?: string | null
    filienExercice?: number | null
    filienAvancement?: string | null
    filienRejetDispo?: boolean | null
    filienRejetCA?: boolean | null
    filienRejetMarche?: boolean | null
    filienMouvement?: string | null
    filienType?: string | null
    filienLibelle?: string | null
    filienCalendrier?: string | null
    filienMonnaie?: string | null
    filienMouvementEx?: string | null
    filienPreBordereau?: string | null
    filienPoste?: string | null
    filienBordereau?: string | null
    filienObjet?: string | null
    filienChapitre?: string | null
    filienNature?: string | null
    filienFonction?: string | null
    filienCodeInterne?: string | null
    filienTypeMouvement?: string | null
    filienSens?: string | null
    filienStructure?: string | null
    filienGestionnaire?: string | null
    filienUncPj?: string | null
    adDomain?: string | null
    signataireRole?: string | null
    signataireDelegation?: string | null
    signataireNom?: string | null
    footer1?: string | null
    footer2?: string | null
    footer3?: string | null
    footerColor?: string | null
    updated_at?: Date | string
    filienUncPass?: string | null
    filienUncUser?: string | null
    filienUncDomain?: string | null
    watermark?: string | null
    dbMode?: string
  }

  export type AppSettingsUpdateInput = {
    financeEmail?: NullableStringFieldUpdateOperationsInput | string | null
    appUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apmUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apmToken?: NullableStringFieldUpdateOperationsInput | string | null
    senderName?: NullableStringFieldUpdateOperationsInput | string | null
    senderEmail?: NullableStringFieldUpdateOperationsInput | string | null
    filienOrga?: NullableStringFieldUpdateOperationsInput | string | null
    filienBudget?: NullableStringFieldUpdateOperationsInput | string | null
    filienExercice?: NullableIntFieldUpdateOperationsInput | number | null
    filienAvancement?: NullableStringFieldUpdateOperationsInput | string | null
    filienRejetDispo?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienRejetCA?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienRejetMarche?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienMouvement?: NullableStringFieldUpdateOperationsInput | string | null
    filienType?: NullableStringFieldUpdateOperationsInput | string | null
    filienLibelle?: NullableStringFieldUpdateOperationsInput | string | null
    filienCalendrier?: NullableStringFieldUpdateOperationsInput | string | null
    filienMonnaie?: NullableStringFieldUpdateOperationsInput | string | null
    filienMouvementEx?: NullableStringFieldUpdateOperationsInput | string | null
    filienPreBordereau?: NullableStringFieldUpdateOperationsInput | string | null
    filienPoste?: NullableStringFieldUpdateOperationsInput | string | null
    filienBordereau?: NullableStringFieldUpdateOperationsInput | string | null
    filienObjet?: NullableStringFieldUpdateOperationsInput | string | null
    filienChapitre?: NullableStringFieldUpdateOperationsInput | string | null
    filienNature?: NullableStringFieldUpdateOperationsInput | string | null
    filienFonction?: NullableStringFieldUpdateOperationsInput | string | null
    filienCodeInterne?: NullableStringFieldUpdateOperationsInput | string | null
    filienTypeMouvement?: NullableStringFieldUpdateOperationsInput | string | null
    filienSens?: NullableStringFieldUpdateOperationsInput | string | null
    filienStructure?: NullableStringFieldUpdateOperationsInput | string | null
    filienGestionnaire?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncPj?: NullableStringFieldUpdateOperationsInput | string | null
    adDomain?: NullableStringFieldUpdateOperationsInput | string | null
    signataireRole?: NullableStringFieldUpdateOperationsInput | string | null
    signataireDelegation?: NullableStringFieldUpdateOperationsInput | string | null
    signataireNom?: NullableStringFieldUpdateOperationsInput | string | null
    footer1?: NullableStringFieldUpdateOperationsInput | string | null
    footer2?: NullableStringFieldUpdateOperationsInput | string | null
    footer3?: NullableStringFieldUpdateOperationsInput | string | null
    footerColor?: NullableStringFieldUpdateOperationsInput | string | null
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    filienUncPass?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncUser?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncDomain?: NullableStringFieldUpdateOperationsInput | string | null
    watermark?: NullableStringFieldUpdateOperationsInput | string | null
    dbMode?: StringFieldUpdateOperationsInput | string
  }

  export type AppSettingsUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    financeEmail?: NullableStringFieldUpdateOperationsInput | string | null
    appUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apmUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apmToken?: NullableStringFieldUpdateOperationsInput | string | null
    senderName?: NullableStringFieldUpdateOperationsInput | string | null
    senderEmail?: NullableStringFieldUpdateOperationsInput | string | null
    filienOrga?: NullableStringFieldUpdateOperationsInput | string | null
    filienBudget?: NullableStringFieldUpdateOperationsInput | string | null
    filienExercice?: NullableIntFieldUpdateOperationsInput | number | null
    filienAvancement?: NullableStringFieldUpdateOperationsInput | string | null
    filienRejetDispo?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienRejetCA?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienRejetMarche?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienMouvement?: NullableStringFieldUpdateOperationsInput | string | null
    filienType?: NullableStringFieldUpdateOperationsInput | string | null
    filienLibelle?: NullableStringFieldUpdateOperationsInput | string | null
    filienCalendrier?: NullableStringFieldUpdateOperationsInput | string | null
    filienMonnaie?: NullableStringFieldUpdateOperationsInput | string | null
    filienMouvementEx?: NullableStringFieldUpdateOperationsInput | string | null
    filienPreBordereau?: NullableStringFieldUpdateOperationsInput | string | null
    filienPoste?: NullableStringFieldUpdateOperationsInput | string | null
    filienBordereau?: NullableStringFieldUpdateOperationsInput | string | null
    filienObjet?: NullableStringFieldUpdateOperationsInput | string | null
    filienChapitre?: NullableStringFieldUpdateOperationsInput | string | null
    filienNature?: NullableStringFieldUpdateOperationsInput | string | null
    filienFonction?: NullableStringFieldUpdateOperationsInput | string | null
    filienCodeInterne?: NullableStringFieldUpdateOperationsInput | string | null
    filienTypeMouvement?: NullableStringFieldUpdateOperationsInput | string | null
    filienSens?: NullableStringFieldUpdateOperationsInput | string | null
    filienStructure?: NullableStringFieldUpdateOperationsInput | string | null
    filienGestionnaire?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncPj?: NullableStringFieldUpdateOperationsInput | string | null
    adDomain?: NullableStringFieldUpdateOperationsInput | string | null
    signataireRole?: NullableStringFieldUpdateOperationsInput | string | null
    signataireDelegation?: NullableStringFieldUpdateOperationsInput | string | null
    signataireNom?: NullableStringFieldUpdateOperationsInput | string | null
    footer1?: NullableStringFieldUpdateOperationsInput | string | null
    footer2?: NullableStringFieldUpdateOperationsInput | string | null
    footer3?: NullableStringFieldUpdateOperationsInput | string | null
    footerColor?: NullableStringFieldUpdateOperationsInput | string | null
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    filienUncPass?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncUser?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncDomain?: NullableStringFieldUpdateOperationsInput | string | null
    watermark?: NullableStringFieldUpdateOperationsInput | string | null
    dbMode?: StringFieldUpdateOperationsInput | string
  }

  export type AppSettingsCreateManyInput = {
    id?: number
    financeEmail?: string | null
    appUrl?: string | null
    apmUrl?: string | null
    apmToken?: string | null
    senderName?: string | null
    senderEmail?: string | null
    filienOrga?: string | null
    filienBudget?: string | null
    filienExercice?: number | null
    filienAvancement?: string | null
    filienRejetDispo?: boolean | null
    filienRejetCA?: boolean | null
    filienRejetMarche?: boolean | null
    filienMouvement?: string | null
    filienType?: string | null
    filienLibelle?: string | null
    filienCalendrier?: string | null
    filienMonnaie?: string | null
    filienMouvementEx?: string | null
    filienPreBordereau?: string | null
    filienPoste?: string | null
    filienBordereau?: string | null
    filienObjet?: string | null
    filienChapitre?: string | null
    filienNature?: string | null
    filienFonction?: string | null
    filienCodeInterne?: string | null
    filienTypeMouvement?: string | null
    filienSens?: string | null
    filienStructure?: string | null
    filienGestionnaire?: string | null
    filienUncPj?: string | null
    adDomain?: string | null
    signataireRole?: string | null
    signataireDelegation?: string | null
    signataireNom?: string | null
    footer1?: string | null
    footer2?: string | null
    footer3?: string | null
    footerColor?: string | null
    updated_at?: Date | string
    filienUncPass?: string | null
    filienUncUser?: string | null
    filienUncDomain?: string | null
    watermark?: string | null
    dbMode?: string
  }

  export type AppSettingsUpdateManyMutationInput = {
    financeEmail?: NullableStringFieldUpdateOperationsInput | string | null
    appUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apmUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apmToken?: NullableStringFieldUpdateOperationsInput | string | null
    senderName?: NullableStringFieldUpdateOperationsInput | string | null
    senderEmail?: NullableStringFieldUpdateOperationsInput | string | null
    filienOrga?: NullableStringFieldUpdateOperationsInput | string | null
    filienBudget?: NullableStringFieldUpdateOperationsInput | string | null
    filienExercice?: NullableIntFieldUpdateOperationsInput | number | null
    filienAvancement?: NullableStringFieldUpdateOperationsInput | string | null
    filienRejetDispo?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienRejetCA?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienRejetMarche?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienMouvement?: NullableStringFieldUpdateOperationsInput | string | null
    filienType?: NullableStringFieldUpdateOperationsInput | string | null
    filienLibelle?: NullableStringFieldUpdateOperationsInput | string | null
    filienCalendrier?: NullableStringFieldUpdateOperationsInput | string | null
    filienMonnaie?: NullableStringFieldUpdateOperationsInput | string | null
    filienMouvementEx?: NullableStringFieldUpdateOperationsInput | string | null
    filienPreBordereau?: NullableStringFieldUpdateOperationsInput | string | null
    filienPoste?: NullableStringFieldUpdateOperationsInput | string | null
    filienBordereau?: NullableStringFieldUpdateOperationsInput | string | null
    filienObjet?: NullableStringFieldUpdateOperationsInput | string | null
    filienChapitre?: NullableStringFieldUpdateOperationsInput | string | null
    filienNature?: NullableStringFieldUpdateOperationsInput | string | null
    filienFonction?: NullableStringFieldUpdateOperationsInput | string | null
    filienCodeInterne?: NullableStringFieldUpdateOperationsInput | string | null
    filienTypeMouvement?: NullableStringFieldUpdateOperationsInput | string | null
    filienSens?: NullableStringFieldUpdateOperationsInput | string | null
    filienStructure?: NullableStringFieldUpdateOperationsInput | string | null
    filienGestionnaire?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncPj?: NullableStringFieldUpdateOperationsInput | string | null
    adDomain?: NullableStringFieldUpdateOperationsInput | string | null
    signataireRole?: NullableStringFieldUpdateOperationsInput | string | null
    signataireDelegation?: NullableStringFieldUpdateOperationsInput | string | null
    signataireNom?: NullableStringFieldUpdateOperationsInput | string | null
    footer1?: NullableStringFieldUpdateOperationsInput | string | null
    footer2?: NullableStringFieldUpdateOperationsInput | string | null
    footer3?: NullableStringFieldUpdateOperationsInput | string | null
    footerColor?: NullableStringFieldUpdateOperationsInput | string | null
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    filienUncPass?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncUser?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncDomain?: NullableStringFieldUpdateOperationsInput | string | null
    watermark?: NullableStringFieldUpdateOperationsInput | string | null
    dbMode?: StringFieldUpdateOperationsInput | string
  }

  export type AppSettingsUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    financeEmail?: NullableStringFieldUpdateOperationsInput | string | null
    appUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apmUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apmToken?: NullableStringFieldUpdateOperationsInput | string | null
    senderName?: NullableStringFieldUpdateOperationsInput | string | null
    senderEmail?: NullableStringFieldUpdateOperationsInput | string | null
    filienOrga?: NullableStringFieldUpdateOperationsInput | string | null
    filienBudget?: NullableStringFieldUpdateOperationsInput | string | null
    filienExercice?: NullableIntFieldUpdateOperationsInput | number | null
    filienAvancement?: NullableStringFieldUpdateOperationsInput | string | null
    filienRejetDispo?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienRejetCA?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienRejetMarche?: NullableBoolFieldUpdateOperationsInput | boolean | null
    filienMouvement?: NullableStringFieldUpdateOperationsInput | string | null
    filienType?: NullableStringFieldUpdateOperationsInput | string | null
    filienLibelle?: NullableStringFieldUpdateOperationsInput | string | null
    filienCalendrier?: NullableStringFieldUpdateOperationsInput | string | null
    filienMonnaie?: NullableStringFieldUpdateOperationsInput | string | null
    filienMouvementEx?: NullableStringFieldUpdateOperationsInput | string | null
    filienPreBordereau?: NullableStringFieldUpdateOperationsInput | string | null
    filienPoste?: NullableStringFieldUpdateOperationsInput | string | null
    filienBordereau?: NullableStringFieldUpdateOperationsInput | string | null
    filienObjet?: NullableStringFieldUpdateOperationsInput | string | null
    filienChapitre?: NullableStringFieldUpdateOperationsInput | string | null
    filienNature?: NullableStringFieldUpdateOperationsInput | string | null
    filienFonction?: NullableStringFieldUpdateOperationsInput | string | null
    filienCodeInterne?: NullableStringFieldUpdateOperationsInput | string | null
    filienTypeMouvement?: NullableStringFieldUpdateOperationsInput | string | null
    filienSens?: NullableStringFieldUpdateOperationsInput | string | null
    filienStructure?: NullableStringFieldUpdateOperationsInput | string | null
    filienGestionnaire?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncPj?: NullableStringFieldUpdateOperationsInput | string | null
    adDomain?: NullableStringFieldUpdateOperationsInput | string | null
    signataireRole?: NullableStringFieldUpdateOperationsInput | string | null
    signataireDelegation?: NullableStringFieldUpdateOperationsInput | string | null
    signataireNom?: NullableStringFieldUpdateOperationsInput | string | null
    footer1?: NullableStringFieldUpdateOperationsInput | string | null
    footer2?: NullableStringFieldUpdateOperationsInput | string | null
    footer3?: NullableStringFieldUpdateOperationsInput | string | null
    footerColor?: NullableStringFieldUpdateOperationsInput | string | null
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    filienUncPass?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncUser?: NullableStringFieldUpdateOperationsInput | string | null
    filienUncDomain?: NullableStringFieldUpdateOperationsInput | string | null
    watermark?: NullableStringFieldUpdateOperationsInput | string | null
    dbMode?: StringFieldUpdateOperationsInput | string
  }

  export type PostgresConfigCreateInput = {
    host: string
    port?: number
    database: string
    schema?: string
    schemaDev?: string
    user: string
    password: string
  }

  export type PostgresConfigUncheckedCreateInput = {
    id?: number
    host: string
    port?: number
    database: string
    schema?: string
    schemaDev?: string
    user: string
    password: string
  }

  export type PostgresConfigUpdateInput = {
    host?: StringFieldUpdateOperationsInput | string
    port?: IntFieldUpdateOperationsInput | number
    database?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    schemaDev?: StringFieldUpdateOperationsInput | string
    user?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
  }

  export type PostgresConfigUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    host?: StringFieldUpdateOperationsInput | string
    port?: IntFieldUpdateOperationsInput | number
    database?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    schemaDev?: StringFieldUpdateOperationsInput | string
    user?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
  }

  export type PostgresConfigCreateManyInput = {
    id?: number
    host: string
    port?: number
    database: string
    schema?: string
    schemaDev?: string
    user: string
    password: string
  }

  export type PostgresConfigUpdateManyMutationInput = {
    host?: StringFieldUpdateOperationsInput | string
    port?: IntFieldUpdateOperationsInput | number
    database?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    schemaDev?: StringFieldUpdateOperationsInput | string
    user?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
  }

  export type PostgresConfigUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    host?: StringFieldUpdateOperationsInput | string
    port?: IntFieldUpdateOperationsInput | number
    database?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    schemaDev?: StringFieldUpdateOperationsInput | string
    user?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type AppSettingsCountOrderByAggregateInput = {
    id?: SortOrder
    financeEmail?: SortOrder
    appUrl?: SortOrder
    apmUrl?: SortOrder
    apmToken?: SortOrder
    senderName?: SortOrder
    senderEmail?: SortOrder
    filienOrga?: SortOrder
    filienBudget?: SortOrder
    filienExercice?: SortOrder
    filienAvancement?: SortOrder
    filienRejetDispo?: SortOrder
    filienRejetCA?: SortOrder
    filienRejetMarche?: SortOrder
    filienMouvement?: SortOrder
    filienType?: SortOrder
    filienLibelle?: SortOrder
    filienCalendrier?: SortOrder
    filienMonnaie?: SortOrder
    filienMouvementEx?: SortOrder
    filienPreBordereau?: SortOrder
    filienPoste?: SortOrder
    filienBordereau?: SortOrder
    filienObjet?: SortOrder
    filienChapitre?: SortOrder
    filienNature?: SortOrder
    filienFonction?: SortOrder
    filienCodeInterne?: SortOrder
    filienTypeMouvement?: SortOrder
    filienSens?: SortOrder
    filienStructure?: SortOrder
    filienGestionnaire?: SortOrder
    filienUncPj?: SortOrder
    adDomain?: SortOrder
    signataireRole?: SortOrder
    signataireDelegation?: SortOrder
    signataireNom?: SortOrder
    footer1?: SortOrder
    footer2?: SortOrder
    footer3?: SortOrder
    footerColor?: SortOrder
    updated_at?: SortOrder
    filienUncPass?: SortOrder
    filienUncUser?: SortOrder
    filienUncDomain?: SortOrder
    watermark?: SortOrder
    dbMode?: SortOrder
  }

  export type AppSettingsAvgOrderByAggregateInput = {
    id?: SortOrder
    filienExercice?: SortOrder
  }

  export type AppSettingsMaxOrderByAggregateInput = {
    id?: SortOrder
    financeEmail?: SortOrder
    appUrl?: SortOrder
    apmUrl?: SortOrder
    apmToken?: SortOrder
    senderName?: SortOrder
    senderEmail?: SortOrder
    filienOrga?: SortOrder
    filienBudget?: SortOrder
    filienExercice?: SortOrder
    filienAvancement?: SortOrder
    filienRejetDispo?: SortOrder
    filienRejetCA?: SortOrder
    filienRejetMarche?: SortOrder
    filienMouvement?: SortOrder
    filienType?: SortOrder
    filienLibelle?: SortOrder
    filienCalendrier?: SortOrder
    filienMonnaie?: SortOrder
    filienMouvementEx?: SortOrder
    filienPreBordereau?: SortOrder
    filienPoste?: SortOrder
    filienBordereau?: SortOrder
    filienObjet?: SortOrder
    filienChapitre?: SortOrder
    filienNature?: SortOrder
    filienFonction?: SortOrder
    filienCodeInterne?: SortOrder
    filienTypeMouvement?: SortOrder
    filienSens?: SortOrder
    filienStructure?: SortOrder
    filienGestionnaire?: SortOrder
    filienUncPj?: SortOrder
    adDomain?: SortOrder
    signataireRole?: SortOrder
    signataireDelegation?: SortOrder
    signataireNom?: SortOrder
    footer1?: SortOrder
    footer2?: SortOrder
    footer3?: SortOrder
    footerColor?: SortOrder
    updated_at?: SortOrder
    filienUncPass?: SortOrder
    filienUncUser?: SortOrder
    filienUncDomain?: SortOrder
    watermark?: SortOrder
    dbMode?: SortOrder
  }

  export type AppSettingsMinOrderByAggregateInput = {
    id?: SortOrder
    financeEmail?: SortOrder
    appUrl?: SortOrder
    apmUrl?: SortOrder
    apmToken?: SortOrder
    senderName?: SortOrder
    senderEmail?: SortOrder
    filienOrga?: SortOrder
    filienBudget?: SortOrder
    filienExercice?: SortOrder
    filienAvancement?: SortOrder
    filienRejetDispo?: SortOrder
    filienRejetCA?: SortOrder
    filienRejetMarche?: SortOrder
    filienMouvement?: SortOrder
    filienType?: SortOrder
    filienLibelle?: SortOrder
    filienCalendrier?: SortOrder
    filienMonnaie?: SortOrder
    filienMouvementEx?: SortOrder
    filienPreBordereau?: SortOrder
    filienPoste?: SortOrder
    filienBordereau?: SortOrder
    filienObjet?: SortOrder
    filienChapitre?: SortOrder
    filienNature?: SortOrder
    filienFonction?: SortOrder
    filienCodeInterne?: SortOrder
    filienTypeMouvement?: SortOrder
    filienSens?: SortOrder
    filienStructure?: SortOrder
    filienGestionnaire?: SortOrder
    filienUncPj?: SortOrder
    adDomain?: SortOrder
    signataireRole?: SortOrder
    signataireDelegation?: SortOrder
    signataireNom?: SortOrder
    footer1?: SortOrder
    footer2?: SortOrder
    footer3?: SortOrder
    footerColor?: SortOrder
    updated_at?: SortOrder
    filienUncPass?: SortOrder
    filienUncUser?: SortOrder
    filienUncDomain?: SortOrder
    watermark?: SortOrder
    dbMode?: SortOrder
  }

  export type AppSettingsSumOrderByAggregateInput = {
    id?: SortOrder
    filienExercice?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
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

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
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

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
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

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
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

  export type PostgresConfigCountOrderByAggregateInput = {
    id?: SortOrder
    host?: SortOrder
    port?: SortOrder
    database?: SortOrder
    schema?: SortOrder
    schemaDev?: SortOrder
    user?: SortOrder
    password?: SortOrder
  }

  export type PostgresConfigAvgOrderByAggregateInput = {
    id?: SortOrder
    port?: SortOrder
  }

  export type PostgresConfigMaxOrderByAggregateInput = {
    id?: SortOrder
    host?: SortOrder
    port?: SortOrder
    database?: SortOrder
    schema?: SortOrder
    schemaDev?: SortOrder
    user?: SortOrder
    password?: SortOrder
  }

  export type PostgresConfigMinOrderByAggregateInput = {
    id?: SortOrder
    host?: SortOrder
    port?: SortOrder
    database?: SortOrder
    schema?: SortOrder
    schemaDev?: SortOrder
    user?: SortOrder
    password?: SortOrder
  }

  export type PostgresConfigSumOrderByAggregateInput = {
    id?: SortOrder
    port?: SortOrder
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
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
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
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
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
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
    in?: number[] | null
    notIn?: number[] | null
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
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
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



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use AppSettingsDefaultArgs instead
     */
    export type AppSettingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = AppSettingsDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PostgresConfigDefaultArgs instead
     */
    export type PostgresConfigArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PostgresConfigDefaultArgs<ExtArgs>

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