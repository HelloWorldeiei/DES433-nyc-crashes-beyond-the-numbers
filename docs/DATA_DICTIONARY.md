# Cleaned Dataset — Data Dictionary

The supplied Parquet file contains **2,132,218 rows and 35 columns**, as read directly from the Parquet metadata. Each row represents a reported crash record. Column types and names below were inspected from the file's schema; explanations summarize the apparent field purpose, not a separately validated transformation specification.

| Column | Type | Meaning |
| --- | --- | --- |
| `crash_date` | Date/time | Collision date |
| `crash_time` | Text | Reported local time |
| `borough` | Text | Recorded NYC borough; may be missing |
| `zip_code` | Text | Reported ZIP code |
| `latitude` | Decimal | Latitude, where available |
| `longitude` | Decimal | Longitude, where available |
| `on_street_name` | Text | On-street name |
| `cross_street_name` | Text | Cross-street name |
| `off_street_name` | Text | Off-street location |
| `number_of_persons_injured` | Integer | People reported injured |
| `number_of_persons_killed` | Integer | People reported killed |
| `number_of_pedestrians_injured` | Integer | Pedestrians injured |
| `number_of_pedestrians_killed` | Integer | Pedestrians killed |
| `number_of_cyclist_injured` | Integer | Cyclists injured |
| `number_of_cyclist_killed` | Integer | Cyclists killed |
| `number_of_motorist_injured` | Integer | Motorists injured |
| `number_of_motorist_killed` | Integer | Motorists killed |
| `contributing_factor_vehicle_1` | Text | First recorded contributing factor |
| `contributing_factor_vehicle_2` | Text | Second recorded contributing factor |
| `collision_id` | Integer | Source collision identifier |
| `vehicle_type_code_1` | Text | First vehicle type recorded |
| `vehicle_type_code_2` | Text | Second vehicle type recorded |
| `factor_group_1` | Text | Prepared grouping for first contributing factor |
| `factor_group_2` | Text | Prepared grouping for second contributing factor |
| `vehicle_group_1` | Text | Prepared first vehicle-type grouping |
| `vehicle_group_2` | Text | Prepared second vehicle-type grouping |
| `year` | Integer | Derived calendar year |
| `month` | Integer | Derived month number |
| `weekday` | Text | Derived weekday |
| `hour` | Integer | Derived hour (0–23) |
| `is_weekend` | Boolean | Whether the crash was on a weekend |
| `severity` | Text | Prepared severity classification |
| `vehicle_count` | Integer | Prepared recorded vehicle count |
| `involves_pedestrian` | Boolean | Prepared pedestrian involvement flag |
| `involves_cyclist` | Boolean | Prepared cyclist involvement flag |

## Important distinctions

- Person counts refer to individuals, not separate crash events. One crash can injure multiple people.
- Missing or unknown geographic values must not be treated as zero or mapped to an arbitrary location.
- `factor_group_*`, `vehicle_group_*`, `severity`, and the derived time fields are prepared classifications. This repository preserves the supplied cleaned data but does **not** claim to contain the full cleaning/transformation pipeline.
- An explicitly recorded `Unspecified` factor is different from a null or missing factor.
- For documented chart calculations and caveats, see [Methodology](METHODOLOGY.md).

To inspect the file locally, install the optional Python requirements (`pip install -r requirements-data.txt`) and run `python scripts/inspect_parquet.py` from the repository root.
