declare module 'jsrsasign' {
  namespace KJUR {
    namespace jws {
      class JWS {
        static sign(
          alg: string,
          header: string,
          payload: string,
          key: string
        ): string;
      }
    }
  }

  export default KJUR;
} 