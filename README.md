# Sunburt Chart Downtime Analysis

| Libre Panel for Sunburt Chart Downtime Analysis

Custom Sunburst Plugin that visualises the Reason Codes Data in a parent-child relationship structure, which shows both the frequency of occurrences and duration.

------

## Influxdb Query example

SELECT "Site", "Area", "Line", "duration", "durationInt", "execute", "held", "idle", "stopped", "complete", "category", "reason", "comment", "parentReason" FROM "Availability"  WHERE $timeFilter

## Data format

Data MUST be formatted as a TABLE !
