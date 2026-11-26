// Desarrollo: las peticiones van a /back-xentrix/api/v1/... y el proxy
// (src/proxy.conf.json) las reenvía a http://localhost:28080, evitando CORS.
export const environment = {
  production: false,
  apiUrl: '/back-xentrix/api/v1'
};
