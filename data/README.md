# Cleaned data not included in the website-only distribution

This package deliberately omits the 53 MiB cleaned Parquet dataset to allow uploading all website files through GitHub's browser interface. **The interactive dashboard remains fully functional**, because all necessary aggregates are already bundled in `assets/js/dashboard-data.js`.

For the complete repository containing the cleaned Parquet dataset, use the full GitHub package (`nyc-crashes-beyond-the-numbers-full-github.zip`) and upload with Git/GitHub Desktop. For documentation of the supplied dataset's 35-column schema, see `docs/DATA_DICTIONARY.md`.
