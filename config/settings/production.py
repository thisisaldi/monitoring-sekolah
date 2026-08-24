from .base import *  # noqa: F401,F403

DEBUG = False

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False

SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)  # noqa: F405
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000)  # noqa: F405
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Vercel (and most PaaS reverse proxies) terminate TLS at the edge and
# forward plain HTTP internally, tagging the original scheme in this
# header. Without this, Django can't tell the request was HTTPS, which
# breaks SECURE_SSL_REDIRECT (infinite redirect loop) and CSRF's
# origin/referer check.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Required whenever the deployed domain isn't implied by ALLOWED_HOSTS
# alone (e.g. a *.vercel.app preview/production URL) -- comma-separated,
# each entry must include the scheme, e.g. "https://myapp.vercel.app".
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])  # noqa: F405
