#!/bin/bash

# WSDMailer Vercel Deployment Script
set -e

echo "🚀 Starting Vercel deployment for WSDMailer..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Vercel CLI not found. Installing...${NC}"
    npm i -g vercel
fi

# Login to Vercel (if not already logged in)
echo -e "${YELLOW}Checking Vercel authentication...${NC}"
vercel whoami || vercel login

# Set project configuration
echo -e "${YELLOW}Configuring project...${NC}"

# Deploy to Vercel
echo -e "${YELLOW}Deploying to Vercel...${NC}"
vercel --prod

echo -e "${GREEN}✅ Deployment complete!${NC}"

# Get the deployment URL
DEPLOYMENT_URL=$(vercel ls | grep 'Production' | awk '{print $2}' | head -1)

echo ""
echo -e "${GREEN}🎉 Your WSDMailer dashboard is live at:${NC}"
echo -e "${GREEN}https://$DEPLOYMENT_URL${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update your Kinde app settings with the new URL"
echo "2. Add environment variables in Vercel dashboard"
echo "3. Test the cron job: https://$DEPLOYMENT_URL/api/cron/sync-domains"
echo "4. Access admin dashboard: https://$DEPLOYMENT_URL/dashboard"
echo ""
echo -e "${GREEN}🔄 Cron job will automatically sync domains every 12 hours!${NC}"
