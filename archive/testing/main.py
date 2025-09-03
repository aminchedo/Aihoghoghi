# main.py - FastAPI Application با حل مشکلات Routing

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os

app = FastAPI(title="AI Hoghogh Application")

# Mount static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = None
if os.path.exists("templates"):
    templates = Jinja2Templates(directory="templates")

# Root redirect به صفحه اصلی
@app.get("/")
async def root():
    """Redirect به صفحه اصلی"""
    return RedirectResponse(url="/home", status_code=307)

@app.get("/home")
async def home(request: Request):
    """صفحه اصلی"""
    if templates:
        return templates.TemplateResponse("index.html", {"request": request})
    else:
        return HTMLResponse("""
        <html>
            <head><title>AI Hoghogh</title></head>
            <body>
                <h1>خوش آمدید به AI Hoghogh</h1>
                <p>سیستم هوش مصنوعی حقوقی</p>
                <a href="/pages">مشاهده صفحات</a>
            </body>
        </html>
        """)

# صفحه GitLab/Git Pages
@app.get("/pages")
async def git_pages(request: Request):
    """صفحه مربوط به Git Pages"""
    try:
        if templates:
            return templates.TemplateResponse("git_pages.html", {"request": request})
        else:
            return HTMLResponse("""
            <html>
                <head><title>Git Pages</title></head>
                <body>
                    <h1>صفحات Git</h1>
                    <p>این صفحه برای نمایش Git Pages می‌باشد</p>
                    <a href="/home">بازگشت به صفحه اصلی</a>
                </body>
            </html>
            """)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در بارگذاری صفحه: {str(e)}")

# API endpoint برای پردازش متن
@app.post("/api/process")
async def process_text(text: str):
    """پردازش متن با AI"""
    try:
        # کد پردازش AI اینجا قرار می‌گیرد
        result = {"processed_text": f"پردازش شده: {text}"}
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check
@app.get("/health")
async def health_check():
    return {"status": "OK", "message": "سرویس فعال است"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)