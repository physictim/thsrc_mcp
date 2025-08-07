from setuptools import setup, find_packages

setup(
    name="mcp-server-thsrc",
    version="0.1.0",
    py_modules=["thsrc"],
    install_requires=[
        "asyncio",
        "httpx",
        "fastmcp>=2.11.0",
        "python-dotenv"
    ],
    entry_points={
        "console_scripts": [
            "mcp-server-thsrc=thsrc:main",
        ],
    },
)