# AFDP Mobile (Flutter Scaffold)

This folder is intentionally scaffold-only for now. It defines the planned Flutter architecture for AFDP while the web MVP and API stabilize.

## Planned Architecture

- Pattern: BLoC for feature-level state management
- Networking: Dio client targeting `/api/v1/` endpoints only
- Mapping: `google_maps_flutter` for discovery map experience
- Images: `cached_network_image` for vendor/food media

## Folder Plan

- `lib/core/api`: HTTP client and interceptors
- `lib/core/config`: environment and runtime config
- `lib/features/search`: search BLoC, models, screen widgets
- `lib/features/vendor_detail`: vendor-specific presentation
- `lib/features/food_detail`: food and ingredient detail views
- `lib/shared`: reusable widgets and utilities

## API Consumption Contract

The mobile app is a pure API consumer and contains no business logic. All search, geospatial filtering, and food-ingredient-vendor relationship logic remains in the backend under `/api/v1/`.
