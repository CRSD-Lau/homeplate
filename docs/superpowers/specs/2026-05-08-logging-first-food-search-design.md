# Logging-First Food Search Design

## Summary

The food database now has enough imported products that a broad Foods tab is not a useful primary experience. HomePlate should make food logging the main way to find and use foods. The standalone `/foods` page remains available as a hidden management fallback for manual food creation/editing, but it should no longer appear in the main bottom navigation or drawer.

## Goals

- Remove the Foods tab from primary navigation.
- Keep `/foods` reachable through logging flows when a user needs to create or manage a manual food.
- Stop the add-food page from listing the food database before the user searches.
- Make food search feel type-ahead: partial input like `Pean` should surface close matches such as peanut-related foods quickly.
- Keep barcode lookup and saved-meal workflows unchanged.

## Non-Goals

- Do not delete the `/foods` route.
- Do not remove manual food editing.
- Do not build a full offline client-side index of all 25,000 foods.
- Do not change the Open Food Facts importer or source data.

## Navigation

Bottom navigation should become four items: Today, Log, Health, Settings. The drawer should remove the Foods item from its main list. `/foods` can still be opened directly by URL and linked from contextual places.

The add-food empty/search state should point users to manual food creation when a query has no useful result. That link can go to `/foods` with the query preserved, so the existing manual-food form remains the management surface for now.

## Add-Food Search Behavior

The add-food page should not render food results for an empty query. Instead, the All foods tab should show a focused empty state that invites the user to search, scan a barcode, or add a manual food.

Once the user enters a query, server-side ranked search should return a limited result set. Results should continue to use existing ranking signals: favourites, recent usage, exact/prefix matches, similarity, brand, aliases, and names.

## Type-Ahead Suggestions

The search input should become a small client component that updates the URL query while the user types, using a debounce so it does not navigate on every keystroke. This keeps data fetching server-side and avoids shipping the full food database to the browser.

The same server-ranked results panel can act as the type-ahead suggestions list. For example, typing `Pean` updates the URL to `?q=Pean`, the server returns peanut-related foods, and the closest matches appear directly below the search bar.

## Data Flow

1. User opens `/log/[mealType]/add`.
2. With no query, HomePlate does not call broad food search for all imported products.
3. User types in the search component.
4. After a short debounce, the component updates `q` in the URL while preserving date/tab.
5. The Server Component reloads with `searchParams.q`.
6. `getFoodAddPageData` fetches ranked foods only when the query is non-empty.
7. User logs a result through the existing `logFoodAction`.

## Edge Cases

- Empty or whitespace query: show no food list.
- No results for a non-empty query: show an empty state with scan barcode and add manual food options.
- My meals tab: keep current saved meal, copy-yesterday, and recent meal behavior.
- Search changes should preserve the selected date and active tab.
- Search should not break barcode flow or saved meal copy return paths.

## Testing

- Unit test the food-search ranking helper for prefix/partial matches such as `Pean` ranking peanut matches above weaker fuzzy matches.
- Test or manually verify that empty add-food search does not render all imported foods.
- Browser verify that typing in the add-food search updates suggestions and preserves the selected date.
- Browser verify that main navigation no longer shows Foods, while direct `/foods` access still works.
