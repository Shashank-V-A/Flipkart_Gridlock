from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from ..services.auth_service import decode_access_token

PUBLIC_API_PATHS = {
    "/api/health",
    "/api/auth/google",
}


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if request.method == "OPTIONS":
            return await call_next(request)

        if not path.startswith("/api/") or path in PUBLIC_API_PATHS:
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse({"detail": "Authentication required"}, status_code=401)

        token = auth_header[7:]
        try:
            request.state.user = decode_access_token(token)
        except Exception:
            return JSONResponse({"detail": "Invalid or expired session"}, status_code=401)

        return await call_next(request)
