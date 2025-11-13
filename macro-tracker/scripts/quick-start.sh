#!/bin/bash

# =====================================================
# FOOD SEARCH SYSTEM - QUICK START SCRIPT
# =====================================================
# Automated setup for the hybrid food search system
#
# Usage:
#   chmod +x scripts/quick-start.sh
#   ./scripts/quick-start.sh

set -e # Exit on error

echo "🚀 Food Search System - Quick Start"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check environment variables
echo "📋 Step 1: Checking environment variables..."
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local not found!${NC}"
    echo ""
    echo "Please create .env.local with:"
    echo "  ANTHROPIC_API_KEY=sk-ant-..."
    echo "  NEXT_PUBLIC_SUPABASE_URL=https://..."
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=..."
    echo "  SUPABASE_SERVICE_ROLE_KEY=..."
    echo "  NEXT_PUBLIC_USDA_API_KEY=..."
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: ANTHROPIC_API_KEY not set${NC}"
    echo "   AI curation will not work without it"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL not set${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Run database migrations
echo "🗄️  Step 3: Running database migrations..."
echo "This will create the curated_foods schema..."

# Check if supabase is initialized
if [ -d "supabase" ]; then
    # Option to reset or just migrate
    read -p "Reset database completely? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx supabase db reset
    else
        npx supabase migration up
    fi
else
    echo -e "${YELLOW}⚠️  Supabase not initialized locally${NC}"
    echo "   Skipping migration (will use remote database)"
fi

echo -e "${GREEN}✅ Database ready${NC}"
echo ""

# Step 4: Generate curated foods (optional)
echo "🤖 Step 4: Generate curated food database..."
echo ""
echo "Options:"
echo "  1) Quick test (chicken only, ~25 foods)"
echo "  2) Essential categories (~150 foods)"
echo "  3) Full database (~500 foods)"
echo "  4) Skip for now"
echo ""
read -p "Choose option (1-4): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo "Generating chicken foods (test)..."
        npm run curate-foods -- --category=chicken
        ;;
    2)
        echo "Generating essential foods..."
        npm run curate-foods -- --category=chicken
        npm run curate-foods -- --category=salmon
        npm run curate-foods -- --category=beef
        npm run curate-foods -- --category=eggs
        npm run curate-foods -- --category=vegetables
        npm run curate-foods -- --category=fruits
        npm run curate-foods -- --category=grains
        ;;
    3)
        echo "Generating full database (this may take 5-10 minutes)..."
        npm run curate-foods -- --all
        ;;
    4)
        echo "Skipping food generation"
        ;;
    *)
        echo "Invalid option, skipping..."
        ;;
esac

echo -e "${GREEN}✅ Curation complete${NC}"
echo ""

# Step 5: Run tests
echo "🧪 Step 5: Running tests..."
read -p "Run comprehensive tests? (Y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    npm run test-search
    echo -e "${GREEN}✅ Tests complete${NC}"
else
    echo "Skipping tests"
fi

echo ""
echo "======================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Start dev server: npm run dev"
echo "  2. Open http://localhost:3000"
echo "  3. Try searching for 'chicken' or 'salmon'"
echo ""
echo "API endpoints available at:"
echo "  POST /api/food-search/hybrid"
echo "  GET  /api/food/{id}"
echo "  GET  /api/food/popular"
echo ""
echo "Documentation: FOOD_SEARCH_UPGRADE_COMPLETE.md"
echo ""
