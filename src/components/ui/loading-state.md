# Loading State Components

A comprehensive set of reusable loading components built with shadcn/ui and Tailwind CSS.

## Components

### `LoadingState`

The main loading component with multiple variants and sizes.

#### Props

- `message?: string` - Main loading message (default: "Loading...")
- `submessage?: string` - Optional secondary message
- `variant?: 'default' | 'minimal' | 'card' | 'inline'` - Visual style variant
- `size?: 'sm' | 'md' | 'lg'` - Size of the component
- `className?: string` - Additional CSS classes

#### Variants

- **`default`** - Full loading state with gradient background and pulsing animation
- **`minimal`** - Simple horizontal layout with spinner and text
- **`card`** - Card-wrapped loading state with ping animation
- **`inline`** - Compact inline loading state

#### Examples

```tsx
// Default loading state
<LoadingState 
  message="Loading your documents..." 
  submessage="Fetching your latest content"
/>

// Minimal loading state
<LoadingState 
  message="Saving changes..." 
  variant="minimal"
  size="sm"
/>

// Card variant for prominent loading
<LoadingState 
  message="Generating content..." 
  submessage="This may take a few moments"
  variant="card"
  size="lg"
/>

// Inline loading for buttons/small areas
<LoadingState 
  message="Processing..." 
  variant="inline"
  size="sm"
/>
```

### Skeleton Components

Skeleton loaders that match the actual content structure for better UX.

#### `DocumentSkeleton`

Detailed skeleton that matches the exact structure of document cards including:
- Document title and date
- Language flow section
- Stats grid (sessions, duration, words)
- Action buttons (Edit, Generate, View)
- Status toggle switch

```tsx
<DocumentSkeleton />
```

#### `DocumentGridSkeleton`

Grid of document skeletons for dashboard loading states.

```tsx
<DocumentGridSkeleton count={6} />
```

#### `ContentDisplaySkeleton`

Comprehensive skeleton for content display/view pages with:
- **Full page layout** with proper background and spacing
- **Breadcrumb navigation** skeleton
- **Hero section** with large circular icon and title/description
- **Collapsible voice input section** with toggle button
- **Generated content section** with header and description
- **5 platform tabs** with first tab active (LinkedIn, Twitter, Twitter Thread, Podcast, Blog)
- **Active content card** with:
  - Platform-branded header with icon and badge
  - Content area with top accent stripe
  - 9 lines of varied-width content text
  - Stats footer (word count, character count, platform optimization)
  - 3 action buttons (Copy, Edit, Refine)
- **Responsive design** for mobile, tablet, and desktop
- **Theme-aware colors** using primary/muted variants
- **Professional animations** with smooth pulse effects

```tsx
<ContentDisplaySkeleton />
```

**Note**: This skeleton includes the full page layout and background, so it should be used as a complete page replacement during loading.

#### `FormSkeleton`

Skeleton for create/edit form pages with:
- Header section
- Form fields
- Language selection dropdowns
- Action buttons

```tsx
<FormSkeleton />
```

#### `DocumentEditorSkeleton`

Skeleton for document editor pages with:
- Header with back button and title
- Action buttons section
- Document info grid (sessions, duration, words, etc.)
- Language information cards
- Sessions list with individual session items
- Combined content preview section

```tsx
<DocumentEditorSkeleton />
```

### Quick Loading States

Pre-configured loading states for common scenarios:

#### `LoadingDocuments`

```tsx
<LoadingDocuments />
```

#### `LoadingContent`

```tsx
<LoadingContent />
```

#### `LoadingSave`

```tsx
<LoadingSave />
```

## Usage in Components

### Document Dashboard

```tsx
import { LoadingDocuments } from '@/components/ui/loading-state';

// In your component
{isLoading ? (
  <LoadingDocuments />
) : (
  // Your content
)}
```

### Content Generation

```tsx
import { LoadingState } from '@/components/ui/loading-state';

// In your component
<LoadingState 
  message="Preparing content generation..." 
  submessage="Loading your document and voice sessions"
  variant="card"
  size="lg"
/>
```

### Button Loading States

```tsx
import { LoadingState } from '@/components/ui/loading-state';

// In your button
<Button disabled={isLoading}>
  {isLoading ? (
    <LoadingState message="Saving..." variant="inline" size="sm" />
  ) : (
    "Save Document"
  )}
</Button>
```

## Features

- **Responsive Design** - Works on all screen sizes
- **Theme Aware** - Uses shadcn/ui color tokens
- **Accessible** - Proper loading indicators
- **Customizable** - Multiple variants and sizes
- **Consistent** - Unified loading experience across the app
- **Performance** - Optimized animations with CSS transforms

## Animation Details

- **Spinner**: Smooth rotation using `animate-spin`
- **Pulse**: Subtle pulsing background using `animate-pulse`
- **Ping**: Expanding ring effect using `animate-ping`
- **Skeleton**: Shimmer effect for content placeholders

All animations respect user preferences for reduced motion.
