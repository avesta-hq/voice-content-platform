# LoadingOverlay Component

A reusable loading overlay component for displaying full-screen loading states with backdrop blur.

## Usage

### Basic Usage
```tsx
import { LoadingOverlay } from '@/components/ui/loading-overlay';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      {/* Your content */}
      <button onClick={() => setIsLoading(true)}>
        Start Loading
      </button>

      {/* Loading overlay */}
      <LoadingOverlay 
        isVisible={isLoading}
        message="Processing your request..."
      />
    </div>
  );
}
```

### Variants

#### 1. Default LoadingOverlay
Full-featured overlay with card background:
```tsx
<LoadingOverlay 
  isVisible={isLoading}
  message="Saving document..."
/>
```

#### 2. Minimal LoadingOverlay
Compact pill-shaped overlay:
```tsx
<LoadingOverlayMinimal 
  isVisible={isLoading}
  message="Updating..."
/>
```

#### 3. Inline Loading Spinner
For inline loading states:
```tsx
<LoadingSpinner size="sm" />
<LoadingSpinner size="default" />
<LoadingSpinner size="lg" />
```

## Props

### LoadingOverlay
- `isVisible: boolean` - Controls visibility
- `message?: string` - Loading message (default: "Loading...")
- `className?: string` - Additional CSS classes

### LoadingSpinner
- `size?: "sm" | "default" | "lg"` - Spinner size
- `className?: string` - Additional CSS classes

## Examples in the App

### Document Status Changes
```tsx
// In DocumentDashboard
<LoadingOverlay 
  isVisible={isStatusChanging}
  message="Marking document as completed..."
/>
```

### Form Submissions
```tsx
// In forms
<LoadingOverlay 
  isVisible={isSubmitting}
  message="Creating document..."
/>
```

### API Calls
```tsx
// For any async operations
<LoadingOverlay 
  isVisible={isApiLoading}
  message="Fetching data..."
/>
```

## Features

- ✅ Full-screen backdrop with blur effect
- ✅ Smooth fade-in/zoom-in animations
- ✅ Theme-aware colors (works with light/dark mode)
- ✅ Accessible and keyboard-friendly
- ✅ Mobile-responsive design
- ✅ Multiple variants for different use cases
- ✅ TypeScript support with proper types
