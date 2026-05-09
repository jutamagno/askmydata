from fastapi import HTTPException


class AppError(HTTPException):
    def __init__(self, status_code: int, code: str, detail: str):
        super().__init__(status_code=status_code, detail=detail)
        self.code = code


class AuthError(AppError):
    def __init__(self, detail: str = "Authentication failed", code: str = "AUTH_ERROR"):
        super().__init__(status_code=401, code=code, detail=detail)


class NotFoundError(AppError):
    def __init__(self, detail: str = "Resource not found", code: str = "NOT_FOUND"):
        super().__init__(status_code=404, code=code, detail=detail)


class QueryError(AppError):
    def __init__(self, detail: str = "Query failed", code: str = "QUERY_ERROR"):
        super().__init__(status_code=422, code=code, detail=detail)


class FileError(AppError):
    def __init__(self, detail: str = "File processing failed", code: str = "FILE_ERROR"):
        super().__init__(status_code=400, code=code, detail=detail)
