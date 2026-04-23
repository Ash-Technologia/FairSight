from setuptools import setup, find_packages

setup(
    name="fairsight",
    version="0.1.0",
    description="Real-time bias monitoring SDK for deployed ML models",
    packages=find_packages(),
    install_requires=["requests>=2.28.0", "numpy>=1.23.0"],
    python_requires=">=3.8",
    author="FairSight Team (Google Solution Challenge 2025)",
    url="https://github.com/your-team/fairsight",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
    ],
)
