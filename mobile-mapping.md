# AFDP Mobile Mapping Guide

## Design Token Mapping (Web → Flutter ThemeData)

| Web token | Flutter equivalent |
|---|---|
| `--color-bg` | `Color(0xFFFAFAF8)` as `scaffoldBackgroundColor` |
| `--color-surface` | `Color(0xFFFFFFFF)` as `cardColor` |
| `--color-surface-hover` | `Color(0xFFF5F2EE)` as `surfaceVariant` |
| `--color-dark` | `Color(0xFF0F0E0D)` |
| `--color-primary` | `Color(0xFFC8522A)` as `colorScheme.primary` |
| `--color-primary-hover` | `Color(0xFFA8401E)` |
| `--color-restaurant` | `Color(0xFFC8522A)` |
| `--color-grocery` | `Color(0xFF2A7A4B)` |
| `--color-text-primary` | `Color(0xFF0F0E0D)` |
| `--color-text-muted` | `Color(0xFF6B6560)` |
| `--color-border` | `Color(0xFFE8E4DF)` |
| `--radius-sm/md/lg/xl/full` | `BorderRadius.circular(...)` constants |
| `--shadow-sm/md/lg` | `BoxShadow` presets |
| spacing scale | `EdgeInsets` constants (`4,8,12,16,24,32,48,64`) |
| `--font-display` | `TextTheme.display*` with Fraunces |
| `--font-body` | `TextTheme.body*` with Inter |

Primary TS token source for Flutter alignment: `apps/web/lib/design-tokens.ts`.

---

## Component Mapping (Web → Flutter)

| Web component | Flutter equivalent |
|---|---|
| `components/search/HeroSearch.tsx` | Search entry widget + route push |
| `components/search/SearchBar.tsx` | `TextField` with debounced controller |
| `components/search/ResultCard.tsx` | `Card` + `InkWell` + chips |
| `components/search/SearchPanel.tsx` | `ListView` + `ExpansionTile` sections |
| `components/map/MapView.tsx` | `MapboxMap` + markers + popup/bottom sheet |
| `components/map/VendorPin.tsx` | Custom marker painter/widget |
| `components/ui/Badge.tsx` | `Chip` |
| `components/vendor/VendorCard.tsx` | Compact vendor `Card` |
| `components/food/FoodDetail.tsx` | Food detail screen body |
| `app/page.tsx` | Landing screen |
| `app/search/page.tsx` | Discovery/search screen |
| `app/vendors/[slug]/page.tsx` | Vendor detail screen |
| `app/foods/[slug]/page.tsx` | Food detail screen |
| `app/vendors/register/page.tsx` | Vendor onboarding form screen |

---

## TanStack Query / Store → BLoC Mapping

### Search flow
- Web hook: `useSearch({ q, lat, lng, radiusKm })`
- BLoC events:
  - `SearchQueryChanged(q)`
  - `SearchLocationUpdated(lat, lng)`
  - `SearchRequested()`
- BLoC states:
  - `SearchInitial`
  - `SearchLoading`
  - `SearchLoaded(SearchResponse)`
  - `SearchError(message)`

### Geolocation flow
- Web hook: `useGeolocation()`
- BLoC events:
  - `GeolocationRequested`
  - `GeolocationFallbackUsed`
- BLoC states:
  - `GeolocationLoading`
  - `GeolocationReady(lat, lng)`
  - `GeolocationErrorWithFallback(lat, lng, message)`

### Map interaction flow
- Web store: `mapStore` (`viewport`, `activeVendorId`, `searchQuery`)
- BLoC events:
  - `MapViewportChanged(lat, lng, zoom)`
  - `VendorPinSelected(vendorId)`
  - `SearchQuerySynced(query)`
- BLoC states:
  - `MapState(viewport, activeVendorId, searchQuery)`

### Vendor registration flow
- Web call: `registerVendor(payload)`
- BLoC events:
  - `VendorRegistrationSubmitted(payload)`
- BLoC states:
  - `VendorRegistrationIdle`
  - `VendorRegistrationSubmitting`
  - `VendorRegistrationSuccess(vendor)`
  - `VendorRegistrationFailure(message)`

---

## API Function Mapping for Mobile

| Web function (`apps/web/lib/api.ts`) | Suggested Flutter API method |
|---|---|
| `searchFood` | `searchFood(...)` |
| `getVendors` | `getVendors(...)` |
| `getVendor` | `getVendorBySlug(...)` |
| `getFoods` | `getFoods()` |
| `getFood` | `getFoodBySlug(...)` |
| `getIngredient` | `getIngredientBySlug(...)` |
| `registerVendor` | `registerVendor(...)` |

Use the same payload/response contracts from `apps/web/types/index.ts`.