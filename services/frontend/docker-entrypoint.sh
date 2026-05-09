#!/bin/sh
cat > /usr/share/nginx/html/config.js << EOF
window.__BACKEND_URL__ = "${BACKEND_URL:-}";
EOF
exec nginx -g "daemon off;"
