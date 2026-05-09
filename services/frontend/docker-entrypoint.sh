#!/bin/sh
cat > /usr/share/nginx/html/config.js << EOF
window.__BACKEND_URL__ = "${BACKEND_URL:-}";
EOF
sed -i "s|proxy_pass \${BACKEND_URL}/;|proxy_pass ${BACKEND_URL:-http://localhost:4000}/;|" /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
