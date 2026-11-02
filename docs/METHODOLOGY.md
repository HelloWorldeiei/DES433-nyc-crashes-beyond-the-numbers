# Methodology and Interpretation

## Source and scope

This dashboard examines reported NYC motor-vehicle crashes during **2013–2025**. It is based on the [NYC Open Data — Motor Vehicle Collisions: Crashes](https://data.cityofnewyork.us/Public-Safety/Motor-Vehicle-Collisions-Crashes/h9gi-nx95) dataset. The uploaded cleaned Parquet file is preserved in `data/`.

**Data provenance note:** The interactive dashboard uses browser-ready, **preaggregated records embedded in `assets/js/dashboard-data.js`**. The cleaned Parquet file is also provided for inspection and further analysis. The supplied HTML describes a source-export aggregation process; the original raw export and exact aggregation/build script were **not** supplied here. As a result, reproducing the exact embedded aggregate file from the Parquet alone is not documented as a supported command.

## Seven interactive views

| View | Visualization | Interpretation |
| --- | --- | --- |
| 1. Changes over time | Indexed or actual-value line chart | Compares crash reports, injured people and killed people. Index = annual value / 2019 value × 100. |
| 2. Road-user outcomes | Two 100% stacked bars + annual drilldown | Shares of recorded injured / killed people across motorists, pedestrians and cyclists. |
| 3. Location patterns | Animated geographic-bin density map | Only geocoded reports, grouped in approximate map bins; animation can be paused and restarted. |
| 4. Borough distribution | Interactive donut | Shares among the five known boroughs; unknown borough records are shown separately. |
| 5. Timing | Day × hour bubble matrix | Bubble area and color both represent the selected count or injury-involved percentage. |
| 6. Vehicle combinations | Upper-triangular heatmap | Pairings of first two recorded vehicle types, unordered, with less common types grouped. |
| 7. Recorded factors | Ranked horizontal bars | Frequent recorded contributing factors; both-`Unspecified` reports separated. |

## Denominators and units

- **Reported crashes** count crash events, not unique people.
- **People injured / killed** count individuals reported, not crashes.
- **Injury-involved crash (%)**: crashes with at least one injured person divided by crash reports with known injury status, multiplied by 100.
- **Road-user composition** is the share of the three classified road-user groups for each outcome. It is **not** the risk of injury or death per road user.
- **Donut slices** show shares of selected known-borough crashes, not borough crash rates or borough-specific injury probabilities.
- **Factor shares** may sum to more than 100% because a report can contain more than one distinct recorded factor.
- **Metric modes** can alter the ranking or scale; compare like with like when interpreting changes.

## Missingness and limitations

1. **2020 reporting break:** NYPD non-injury reporting practices changed in April 2020 and travel patterns changed during the pandemic. Comparing pre-2020 and later crash counts requires caution, even though the main trend graphic intentionally omits the interruption marker.
2. **No exposure denominators:** Without consistent vehicle trips, person-trips, travel distance or population exposure, chart counts do not establish risk per trip.
3. **Geocoding coverage:** Reports with missing or unusable coordinates do not appear as map marks, though they remain in other totals. Borough outlines shown are approximate visual references.
4. **Vehicle factors:** Only the first two recorded vehicle types and contributing-factor fields are included in the associated pair/factor views, not all vehicles or all possible crash conditions.
5. **Unknown and Unspecified:** Missing borough, unknown vehicle grouping, and explicitly `Unspecified` factor fields are tracked separately where supported; do not infer zeros.
6. **Not causal:** Recorded factors represent police-recorded classifications and do not independently prove responsibility, fault, or causation.
7. **Prepared dataset vs. embedded aggregates:** The exact transformation steps leading to the dashboard's embedded aggregates have not been supplied. This repository should not be presented as a fully reproducible ETL pipeline.

## Colors, interactions and accessibility

The website uses a restrained Fresh Coastal palette. Hover/focus tooltips provide precise data values; selected panels have keyboard-focusable controls where implemented; year and borough filters update the relevant charts. The time/vehicle matrices prioritize patterns over reading every value at once; exact numbers are available through interactions. A map animation may start automatically and can be paused.
