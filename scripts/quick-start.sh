#!/bin/bash
# quick-start.sh

set -e

echo "🚀 Iranian Legal Archive System - Quick Start Deployment"
echo "========================================================"
echo ""

# Make all scripts executable
echo "🔧 Making scripts executable..."
chmod +x *.sh

# Function to display menu
show_menu() {
    echo ""
    echo "📋 Deployment Options:"
    echo "1.  Complete Server Setup (First time only)"
    echo "2.  Setup Application Environment"
    echo "3.  Configure Environment Variables"
    echo "4.  Setup SSL Certificate"
    echo "5.  Deploy Application"
    echo "6.  Run Tests"
    echo "7.  Setup Monitoring"
    echo "8.  Setup Automated Health Monitoring"
    echo "9.  Setup Automated Backups"
    echo "10. Setup Automated Updates"
    echo "11. Run All Steps (Complete Deployment)"
    echo "0.  Exit"
    echo ""
}

# Function to run complete deployment
run_complete_deployment() {
    echo "🚀 Starting complete deployment process..."
    
    # Get domain information
    read -p "Enter your domain name (e.g., iranianlaw.tk): " DOMAIN
    read -p "Enter your email for SSL certificate: " EMAIL
    
    echo ""
    echo "Starting deployment for domain: $DOMAIN"
    echo "Email: $EMAIL"
    echo ""
    
    # Step 1: Server Setup
    echo "📦 Step 1: Server Setup"
    ./server-setup.sh
    
    # Step 2: Environment Setup
    echo "🏗️ Step 2: Environment Setup"
    ./setup-environment.sh "$DOMAIN"
    
    # Step 3: Environment Configuration
    echo "⚙️ Step 3: Environment Configuration"
    ./create-env-file.sh
    
    # Step 4: SSL Setup
    echo "🔒 Step 4: SSL Setup"
    ./setup-ssl.sh "$DOMAIN" "$EMAIL"
    
    # Step 5: Deploy Application
    echo "🚀 Step 5: Deploy Application"
    ./deploy.sh
    
    # Step 6: Run Tests
    echo "🧪 Step 6: Run Tests"
    ./test-deployment.sh "$DOMAIN"
    
    # Step 7: Setup Monitoring
    echo "📊 Step 7: Setup Monitoring"
    ./setup-monitoring.sh
    
    # Step 8: Setup Automated Health Monitoring
    echo "🏥 Step 8: Setup Automated Health Monitoring"
    sudo cp health-monitor.sh /usr/local/bin/
    echo "*/5 * * * * /usr/local/bin/health-monitor.sh" | sudo crontab -
    
    # Step 9: Setup Automated Backups
    echo "💾 Step 9: Setup Automated Backups"
    sudo cp backup-system.sh /usr/local/bin/
    echo "0 2 * * * /usr/local/bin/backup-system.sh" | sudo crontab -
    
    # Step 10: Setup Automated Updates
    echo "🔄 Step 10: Setup Automated Updates"
    sudo cp update-system.sh /usr/local/bin/
    echo "0 3 * * 0 /usr/local/bin/update-system.sh" | sudo crontab -
    
    echo ""
    echo "🎉 Complete deployment finished!"
    echo "🌐 Your application is available at: https://$DOMAIN"
    echo "📊 Monitoring dashboard: http://$DOMAIN:3001"
    echo ""
    echo "📝 Next steps:"
    echo "- Test all functionality"
    echo "- Configure monitoring alerts"
    echo "- Review security settings"
    echo "- Document any custom configurations"
}

# Main menu loop
while true; do
    show_menu
    read -p "Select an option (0-11): " choice
    
    case $choice in
        1)
            echo "📦 Running server setup..."
            ./server-setup.sh
            ;;
        2)
            read -p "Enter your domain name: " DOMAIN
            echo "🏗️ Setting up application environment..."
            ./setup-environment.sh "$DOMAIN"
            ;;
        3)
            echo "⚙️ Configuring environment variables..."
            ./create-env-file.sh
            ;;
        4)
            read -p "Enter your domain name: " DOMAIN
            read -p "Enter your email: " EMAIL
            echo "🔒 Setting up SSL certificate..."
            ./setup-ssl.sh "$DOMAIN" "$EMAIL"
            ;;
        5)
            echo "🚀 Deploying application..."
            ./deploy.sh
            ;;
        6)
            read -p "Enter your domain name: " DOMAIN
            echo "🧪 Running tests..."
            ./test-deployment.sh "$DOMAIN"
            ;;
        7)
            echo "📊 Setting up monitoring..."
            ./setup-monitoring.sh
            ;;
        8)
            echo "🏥 Setting up automated health monitoring..."
            sudo cp health-monitor.sh /usr/local/bin/
            echo "*/5 * * * * /usr/local/bin/health-monitor.sh" | sudo crontab -
            echo "✅ Health monitoring scheduled (every 5 minutes)"
            ;;
        9)
            echo "💾 Setting up automated backups..."
            sudo cp backup-system.sh /usr/local/bin/
            echo "0 2 * * * /usr/local/bin/backup-system.sh" | sudo crontab -
            echo "✅ Daily backups scheduled (2:00 AM)"
            ;;
        10)
            echo "🔄 Setting up automated updates..."
            sudo cp update-system.sh /usr/local/bin/
            echo "0 3 * * 0 /usr/local/bin/update-system.sh" | sudo crontab -
            echo "✅ Weekly updates scheduled (Sunday 3:00 AM)"
            ;;
        11)
            run_complete_deployment
            ;;
        0)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please select 0-11."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done