"""
Quick setup script for AI Nutrition Coach development environment.
"""

import os
import sys
import subprocess
from pathlib import Path


def check_python_version():
    """Verify Python 3.10+ is installed."""
    if sys.version_info < (3, 10):
        print("❌ Python 3.10+ is required")
        print(f"   Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")


def create_virtual_environment():
    """Create virtual environment if it doesn't exist."""
    venv_path = Path(__file__).parent / "venv"

    if venv_path.exists():
        print("✅ Virtual environment already exists")
        return

    print("📦 Creating virtual environment...")
    subprocess.run([sys.executable, "-m", "venv", str(venv_path)], check=True)
    print("✅ Virtual environment created")


def install_dependencies():
    """Install Python dependencies."""
    print("📦 Installing dependencies...")

    venv_path = Path(__file__).parent / "venv"
    pip_path = venv_path / "Scripts" / "pip.exe" if os.name == "nt" else venv_path / "bin" / "pip"

    requirements_path = Path(__file__).parent / "requirements.txt"

    subprocess.run([str(pip_path), "install", "-r", str(requirements_path)], check=True)
    print("✅ Dependencies installed")


def create_env_file():
    """Create .env file from .env.example if it doesn't exist."""
    env_path = Path(__file__).parent / ".env"
    example_path = Path(__file__).parent / ".env.example"

    if env_path.exists():
        print("✅ .env file already exists")
        return

    if not example_path.exists():
        print("⚠️  .env.example not found, skipping .env creation")
        return

    print("📝 Creating .env file from .env.example...")
    with open(example_path, 'r') as example_file:
        with open(env_path, 'w') as env_file:
            env_file.write(example_file.read())

    print("✅ .env file created")
    print("⚠️  IMPORTANT: Edit api/.env and add your actual API keys!")


def verify_setup():
    """Verify the setup is correct."""
    print("\n🔍 Verifying setup...")

    try:
        # Test settings import
        from api.agent.settings import settings
        print(f"✅ Settings loaded (LLM Model: {settings.llm_model})")
    except Exception as e:
        print(f"❌ Settings load failed: {e}")
        print("   Make sure to set API keys in api/.env")
        return False

    try:
        # Test agent import
        from api.agent.coach_agent import nutrition_coach
        print(f"✅ Agent initialized ({len(nutrition_coach.tools)} tools registered)")

        if len(nutrition_coach.tools) != 3:
            print(f"⚠️  Expected 3 tools, found {len(nutrition_coach.tools)}")
            return False

    except Exception as e:
        print(f"❌ Agent initialization failed: {e}")
        return False

    return True


def print_next_steps():
    """Print next steps for the user."""
    print("\n" + "=" * 60)
    print("✅ Setup Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("\n1. Activate virtual environment:")
    if os.name == "nt":
        print("   .\\venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")

    print("\n2. Edit api/.env with your actual API keys:")
    print("   - SUPABASE_URL")
    print("   - SUPABASE_SERVICE_KEY")
    print("   - LLM_API_KEY")

    print("\n3. Run tests:")
    print("   pytest api/tests/ -v")

    print("\n4. Start development server:")
    print("   uvicorn api.main:app --reload --port 8000")

    print("\n5. Visit http://localhost:8000 to test the API")
    print("\nFor more info, see api/README.md")
    print("=" * 60)


def main():
    """Main setup function."""
    print("🚀 AI Nutrition Coach - Setup Script")
    print("=" * 60)

    try:
        check_python_version()
        create_virtual_environment()
        install_dependencies()
        create_env_file()

        # Only verify if .env has been configured
        env_path = Path(__file__).parent / ".env"
        if env_path.exists():
            # Check if API keys have been set
            with open(env_path, 'r') as f:
                env_content = f.read()
                if "your-" in env_content or "xxx" in env_content:
                    print("\n⚠️  .env file still has placeholder values")
                    print("   Skipping verification - update .env with real API keys first")
                else:
                    if verify_setup():
                        print("\n✅ All verification checks passed!")
                    else:
                        print("\n⚠️  Some verification checks failed")
        else:
            print("\n⚠️  .env file not found - create it from .env.example")

        print_next_steps()

    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
