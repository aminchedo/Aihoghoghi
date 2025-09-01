# 🏛️ Persian Legal Document Archive & Analyzer - Modern UI

A modern, production-ready React-based frontend for the Persian Legal Document Archive & Analyzer system. This UI provides a comprehensive interface for document processing, analysis, proxy management, and legal database search with full RTL support and Persian typography.

## ✨ Features

### 🎯 Core Functionality
- **Real-time Dashboard** - Live metrics, system health, and activity monitoring
- **Document Processing** - Bulk URL processing with progress tracking and WebSocket updates
- **Proxy Management** - Health checks, automatic rotation, and performance monitoring
- **Legal Database Search** - Full-text and semantic search with advanced filtering
- **Settings Management** - API configuration, proxy settings, and system preferences

### 🎨 User Experience
- **RTL-First Design** - Native right-to-left layout with Persian typography
- **Dark/Light Themes** - Automatic system preference detection with manual toggle
- **Responsive Layout** - Mobile-first design that works on all screen sizes
- **Accessibility** - WCAG 2.1 compliant with keyboard navigation and screen reader support
- **Progressive Web App** - Offline support and native app-like experience

### 🔧 Technical Features
- **Modern React 18** - Hooks, Suspense, and concurrent features
- **TypeScript Ready** - Full type safety and IntelliSense support
- **Real-time Updates** - WebSocket integration for live progress tracking
- **API Integration** - Comprehensive REST API client with error handling
- **Performance Optimized** - Code splitting, lazy loading, and caching strategies

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0+ and npm 8.0+
- Python backend server running on port 8000

### Installation

```bash
# Clone the repository
git clone https://github.com/iranian-legal-archive/ui.git
cd ui

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Backend Setup
Make sure the Python backend is running:

```bash
# In the backend directory
uvicorn app:app --reload --port 8000
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Header, Sidebar, Layout components
│   ├── pages/          # Main page components
│   ├── document/       # Document processing components
│   ├── proxy/          # Proxy management components
│   ├── search/         # Search interface components
│   ├── settings/       # Settings panel components
│   └── ui/             # Reusable UI components
├── contexts/           # React context providers
│   ├── ThemeContext.jsx
│   ├── ConfigContext.jsx
│   └── NotificationContext.jsx
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── styles/             # CSS and styling
└── App.jsx            # Main application component
```

## 🛠️ Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Test coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Environment Configuration

Create a `.env.local` file for local development:

```env
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_WS_BASE_URL=ws://127.0.0.1:8000/ws

# Development flags
VITE_DEBUG=true
VITE_MOCK_DATA=false
```

## 🔌 API Integration

The frontend integrates with the following backend endpoints:

### Core Endpoints
- `GET /api/status` - System status and health
- `GET /api/stats` - Comprehensive system statistics
- `GET /api/logs` - Recent system logs

### Document Processing
- `POST /api/process-urls` - Start bulk URL processing
- `GET /api/processed-documents` - Retrieve processed documents
- `POST /api/upload-urls` - Upload URLs from file
- `GET /api/export/{format}` - Export documents (JSON/CSV)

### Network & Proxy Management
- `GET /api/network` - Network status and proxy statistics
- `GET /api/network/proxies` - List all proxies
- `POST /api/network/test` - Test proxy health
- `POST /api/network/update` - Update proxy list

### Search & Database
- `POST /api/search` - Search legal documents
- `GET /api/legal-db/stats` - Database statistics
- `GET /api/legal-db/documents` - Retrieve legal documents

### Real-time Communication
- `WebSocket /ws` - Real-time progress updates and notifications

## 🎨 Theming & Customization

### Color System
The UI uses a comprehensive color system with support for light and dark themes:

```css
/* Primary colors */
--color-primary: #3b82f6;
--color-secondary: #a855f7;
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
```

### Typography
- **Primary Font**: Vazirmatn (Persian)
- **Fallback Fonts**: Tahoma, IRANSans, sans-serif
- **Weights**: 300, 400, 500, 600, 700, 800, 900

### Responsive Breakpoints
```css
xs: 475px
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

## 📱 Components

### Layout Components
- **Header** - Navigation, theme toggle, system status
- **Sidebar** - Main navigation with collapsible submenus
- **Layout** - Responsive layout wrapper

### Page Components
- **Dashboard** - System overview with real-time metrics
- **DocumentProcessing** - Bulk processing interface with progress tracking
- **ProxyDashboard** - Proxy management and health monitoring
- **SearchDatabase** - Legal document search interface
- **Settings** - System configuration panel

### UI Components
- **StatsCard** - Metric display cards with trend indicators
- **Chart** - Responsive charts with RTL support
- **LoadingSpinner** - Loading states with various sizes
- **ErrorMessage** - Error display with retry functionality
- **Notification** - Toast notifications with Persian text

## 🧪 Testing

### Test Structure
```
tests/
├── components/         # Component tests
├── pages/             # Page integration tests
├── hooks/             # Custom hook tests
├── utils/             # Utility function tests
└── e2e/               # End-to-end tests
```

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests with Cypress
npm run test:e2e

# Visual regression tests
npm run test:visual
```

## 🚀 Deployment

### Production Build
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Docker Deployment
```bash
# Build Docker image
docker build -t legal-archive-ui .

# Run container
docker run -p 3000:3000 legal-archive-ui
```

### Environment Variables
```env
# Production API endpoint
VITE_API_BASE_URL=https://api.legal-archive.ir/api
VITE_WS_BASE_URL=wss://api.legal-archive.ir/ws

# Feature flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
```

## 📊 Performance

### Optimization Features
- **Code Splitting** - Automatic route-based code splitting
- **Tree Shaking** - Remove unused code from bundles
- **Asset Optimization** - Image compression and format conversion
- **Caching** - Service worker caching for offline support
- **Lazy Loading** - Components and images loaded on demand

### Performance Metrics
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Time to Interactive** < 3.0s
- **Cumulative Layout Shift** < 0.1

## 🔒 Security

### Security Features
- **Content Security Policy** - Prevent XSS attacks
- **HTTPS Only** - Force secure connections in production
- **Input Sanitization** - Clean user inputs before processing
- **API Rate Limiting** - Prevent abuse and DoS attacks

## 🌐 Internationalization

### RTL Support
- Native right-to-left layout
- Mirrored icons and animations
- Persian number formatting
- Date and time localization

### Language Features
- Persian (Farsi) primary language
- Arabic numeral support
- Jalali calendar integration
- Cultural date/time formats

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **Husky** - Pre-commit hooks
- **Conventional Commits** - Standardized commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Frontend Team** - React, TypeScript, UI/UX
- **Backend Team** - Python, FastAPI, Database
- **DevOps Team** - Docker, CI/CD, Deployment

## 📞 Support

For support and questions:
- **Issues** - [GitHub Issues](https://github.com/iranian-legal-archive/ui/issues)
- **Discussions** - [GitHub Discussions](https://github.com/iranian-legal-archive/ui/discussions)
- **Email** - support@legal-archive.ir

## 🗺️ Roadmap

### v2.1.0 (Planned)
- [ ] Advanced search filters
- [ ] Document comparison tool
- [ ] Export to multiple formats
- [ ] Mobile app (React Native)

### v2.2.0 (Future)
- [ ] AI-powered document analysis
- [ ] Collaborative features
- [ ] Advanced reporting
- [ ] API v2 integration

---

Made with ❤️ for the Persian legal community