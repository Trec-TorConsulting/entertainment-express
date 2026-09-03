# Entertainment Express - Phase 4 Frontend Deployment

## Overview

Phase 4 includes three production-grade frontend applications:
1. **Customer Portal** (React SPA) - Booking management, contract signing, crew tracking
2. **Dispatch Portal** (React SPA) - Real-time dispatch board, crew assignment, WebSocket integration
3. **Crew Mobile App** (React Native + Expo) - iOS/Android native apps

All frontends follow enterprise patterns:
- TypeScript for type safety
- State management (Zustand)
- API integration (Axios + React Query)
- Responsive design (Tailwind CSS)
- Comprehensive error handling
- Tests (Vitest + Jest)

---

## Local Development Setup

### Portal Kit v2 & Multi-Portal Production Suite (Phase 40)

The portals share `@portal-kit` (Radix primitives, Tailwind design system, Storybook tokens, PQB quality gates):

```bash
# 1. Install & Build Shared Design System
cd frontend/portal-kit
npm install
npm run build:storybook   # builds Storybook documentation & token specs

# 2. Build Owner Portal SPA (Outputs to entertainment_express/public/owner)
cd ../owner-portal
npm install
npm run build

# 3. Build Employee Portal SPA (Outputs to entertainment_express/public/employee)
cd ../employee-portal
npm install
npm run build

# 4. Build Customer / Client Portal SPA (Outputs to entertainment_express/public/client)
cd ../customer-portal
npm install
npm run build

# 5. Verify Build Bundles
cd ../..
python3 smoke_test.py
```

### Customer Portal

```bash
cd frontend/customer-portal
npm install

# Development server (http://localhost:5173)
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Dispatch Portal

```bash
cd frontend/dispatch-portal
npm install

# Development server (http://localhost:5174)
npm run dev

# Build for production
npm run build
```

### Crew Mobile App

```bash
cd frontend/crew-app
npm install

# Start Expo (press 'w' for web, 'a' for Android, 'i' for iOS)
npm start

# Build APK (Android)
npm run build:android

# Build IPA (iOS)
npm run build:ios
```

---

## Environment Configuration

### Customer Portal (.env)

```
VITE_API_BASE_URL=https://api.entx.app/api/v2
VITE_JWT_EXPIRY=3600
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### Dispatch Portal (.env)

```
VITE_API_BASE_URL=https://api.entx.app/api/v2
VITE_WEBSOCKET_URL=wss://api.entx.app
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### Crew App (app.json)

```json
{
  "expo": {
    "name": "Entertainment Express",
    "slug": "ee-crew-app",
    "version": "1.0.0",
    "apiUrl": "https://api.entx.app/api/v2"
  }
}
```

---

## Docker Deployment

### Frontend Docker Image

```dockerfile
# Dockerfile for Customer Portal (dispatch-portal similar)
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Build & Push

```bash
# Build image
docker build -t entertainment-express-customer-portal:1.0.0 .

# Push to registry
docker push gcr.io/my-project/entertainment-express-customer-portal:1.0.0

# Deploy to Kubernetes
kubectl set image deployment/customer-portal \
  customer-portal=gcr.io/my-project/entertainment-express-customer-portal:1.0.0
```

---

## Kubernetes Deployment

### Customer Portal Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: customer-portal
  namespace: entertainment-express
spec:
  replicas: 2
  selector:
    matchLabels:
      app: customer-portal
  template:
    metadata:
      labels:
        app: customer-portal
    spec:
      containers:
      - name: customer-portal
        image: gcr.io/my-project/entertainment-express-customer-portal:1.0.0
        ports:
        - containerPort: 80
        env:
        - name: REACT_APP_API_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: api-url
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: customer-portal
  namespace: entertainment-express
spec:
  selector:
    app: customer-portal
  type: LoadBalancer
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: customer-portal
  namespace: entertainment-express
spec:
  ingressClassName: nginx
  rules:
  - host: customer.entx.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: customer-portal
            port:
              number: 80
  tls:
  - hosts:
    - customer.entx.app
    secretName: customer-portal-tls
```

### Dispatch Portal Deployment (similar with WebSocket)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dispatch-portal
  namespace: entertainment-express
spec:
  replicas: 2
  selector:
    matchLabels:
      app: dispatch-portal
  template:
    metadata:
      labels:
        app: dispatch-portal
    spec:
      containers:
      - name: dispatch-portal
        image: gcr.io/my-project/entertainment-express-dispatch-portal:1.0.0
        ports:
        - containerPort: 80
        env:
        - name: REACT_APP_API_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: api-url
        - name: REACT_APP_WS_URL
          value: wss://api.entx.app
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 1Gi
```

---

## CI/CD Pipeline (GitHub Actions)

### Build & Deploy Frontend

```yaml
name: Deploy Frontend

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [customer-portal, dispatch-portal]

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/${{ matrix.app }}/package-lock.json

    - name: Install dependencies
      working-directory: frontend/${{ matrix.app }}
      run: npm ci

    - name: Run tests
      working-directory: frontend/${{ matrix.app }}
      run: npm run test

    - name: Build
      working-directory: frontend/${{ matrix.app }}
      env:
        VITE_API_BASE_URL: https://api.entx.app/api/v2
      run: npm run build

    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: ${{ matrix.app }}-build
        path: frontend/${{ matrix.app }}/dist

  docker:
    needs: build
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [customer-portal, dispatch-portal]

    steps:
    - uses: actions/checkout@v3

    - name: Download artifacts
      uses: actions/download-artifact@v3
      with:
        name: ${{ matrix.app }}-build
        path: frontend/${{ matrix.app }}/dist

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Authenticate to Google Cloud
      uses: google-github-actions/auth@v1
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}

    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v1

    - name: Configure Docker authentication
      run: gcloud auth configure-docker gcr.io

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: frontend/${{ matrix.app }}
        push: true
        tags: |
          gcr.io/${{ secrets.GCP_PROJECT_ID }}/entertainment-express-${{ matrix.app }}:${{ github.sha }}
          gcr.io/${{ secrets.GCP_PROJECT_ID }}/entertainment-express-${{ matrix.app }}:latest

  deploy:
    needs: docker
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [customer-portal, dispatch-portal]

    steps:
    - uses: actions/checkout@v3

    - name: Authenticate to Google Cloud
      uses: google-github-actions/auth@v1
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}

    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v1

    - name: Get GKE cluster credentials
      run: |
        gcloud container clusters get-credentials entertainment-express-prod \
          --region us-central1 \
          --project ${{ secrets.GCP_PROJECT_ID }}

    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/${{ matrix.app }} \
          ${{ matrix.app }}=gcr.io/${{ secrets.GCP_PROJECT_ID }}/entertainment-express-${{ matrix.app }}:${{ github.sha }} \
          -n entertainment-express
        kubectl rollout status deployment/${{ matrix.app }} -n entertainment-express
```

---

## Crew Mobile App Deployment (EAS)

### Configure Submission

```json
{
  "expo": {
    "name": "Entertainment Express",
    "slug": "ee-crew-app",
    "version": "1.0.0",
    "plugins": [
      ["expo-location", { "locationAlwaysAndWhenInUsePermission": "Allow Entertainment Express to access your location" }],
      ["expo-notifications", {}]
    ]
  },
  "build": {
    "production": {
      "node": "18.0.0"
    },
    "preview": {
      "node": "18.0.0"
    },
    "development": {
      "node": "18.0.0"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.entertainmentexpress.crew"
      },
      "android": {
        "package": "com.entertainmentexpress.crew"
      }
    }
  }
}
```

### Build & Submit

```bash
# Trigger EAS build (will build both iOS & Android)
eas build --platform all --auto-submit

# Or build locally with APK for testing
eas build --platform android --local

# Submit to app stores
eas submit --platform all
```

---

## Performance Optimization

### Frontend Best Practices

1. **Code Splitting**
   ```tsx
   const BookingDetail = React.lazy(() => import('./BookingDetail'));
   
   <Suspense fallback={<Loading />}>
     <BookingDetail />
   </Suspense>
   ```

2. **Image Optimization**
   ```tsx
   <img
     src="crew.jpg"
     srcSet="crew-small.jpg 480w, crew-large.jpg 1200w"
     sizes="(max-width: 600px) 480px, 1200px"
   />
   ```

3. **API Caching (React Query)**
   ```tsx
   useQuery(['bookings'], fetchBookings, {
     staleTime: 60000,      // 1 minute
     cacheTime: 3600000,    // 1 hour
     refetchInterval: 300000 // 5 minutes
   });
   ```

4. **Bundle Size Analysis**
   ```bash
   npm run build -- --analyze
   ```

---

## Security Considerations

1. **JWT Token Management**
   - Store tokens in httpOnly cookies (not localStorage)
   - Implement automatic refresh on 401 responses
   - Clear tokens on logout

2. **CORS & CSP**
   ```nginx
   add_header "Content-Security-Policy" "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
   add_header "X-Content-Type-Options" "nosniff";
   add_header "X-Frame-Options" "DENY";
   ```

3. **Rate Limiting** (via Nginx or API Gateway)
   ```nginx
   limit_req_zone $binary_remote_addr zone=app:10m rate=10r/s;
   limit_req zone=app burst=20;
   ```

---

## Monitoring & Logging

### Frontend Monitoring

```tsx
// Sentry integration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Log API errors
api.interceptors.response.use(
  res => res,
  error => {
    Sentry.captureException(error);
    console.error('[API Error]', error);
    throw error;
  }
);
```

### Production Metrics

- **Page Load Time** (Web Vitals)
- **API Response Time** (avg < 200ms)
- **Error Rate** (< 0.1%)
- **Crash Rate** (mobile)

---

## Rollback Procedure

```bash
# View deployment history
kubectl rollout history deployment/customer-portal -n entertainment-express

# Rollback to previous version
kubectl rollout undo deployment/customer-portal -n entertainment-express

# Rollback to specific revision
kubectl rollout undo deployment/customer-portal --to-revision=3 -n entertainment-express
```

---

## Testing Strategy

### Unit Tests (Vitest)
- Component snapshot tests
- Hook tests (useAuth, useDispatch)
- Utility function tests

### Integration Tests
- API integration with mock server
- User workflow tests (booking → payment)
- Error handling flows

### E2E Tests (Playwright)
- Full customer journey
- Dispatch board real-time updates
- Mobile app critical paths

### Performance Tests
- Lighthouse CI
- Core Web Vitals threshold
- Bundle size budget

---

## Known Limitations & Roadmap

**Current Phase (1.0):**
- Web portals (React SPA)
- Mobile app (React Native)
- Real-time dispatch board (WebSocket)

**Future Enhancements:**
- Progressive Web App (PWA) offline support
- Native notifications (push)
- Advanced scheduling (drag & drop)
- Analytics dashboard
- Integration with 3rd-party services (Stripe, Slack, etc.)

---

## Support & Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot GET /" on deployment | Check nginx.conf, ensure `try_files $uri /index.html` for SPA |
| WebSocket connection fails | Check firewall rules, verify WSS endpoint, check CORS headers |
| Mobile app crashes on startup | Check expo logs: `expo doctor --fix` |
| Slow API responses | Check database query performance, enable caching |

---

## Deployment Checklist

- [ ] All tests passing (npm run test)
- [ ] No console errors/warnings
- [ ] Environment variables configured
- [ ] Docker images built and pushed
- [ ] Kubernetes manifests applied
- [ ] DNS records updated
- [ ] SSL/TLS certificates valid
- [ ] Database migrations completed
- [ ] Monitoring & alerting configured
- [ ] Backup strategy in place
- [ ] Runbook documentation updated
- [ ] Post-deployment smoke tests passed
