# CSV Import Script for Jobs Data

This script imports job data from a CSV file into your Supabase database.

## Prerequisites

1. Ensure your `.env` file contains:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Install dependencies:
   ```bash
   npm install
   ```

## CSV File Format

Your CSV file must have the following columns (header row required):

- `title` (required) - Job title
- `company` (required) - Company name
- `location` (optional) - Job location
- `job_type` (optional) - e.g., Full-time, Part-time, Contract, Internship
- `posted_by` (optional) - Name of person who posted the job
- `posted_date` (optional) - Date format: YYYY-MM-DD or any standard date format
- `deadline` (optional) - Application deadline in YYYY-MM-DD or standard format
- `compensation` (optional) - Salary or hourly rate
- `category` (optional) - Practice area (e.g., Corporate, Litigation, IP)
- `description` (required) - Full job description

### Example CSV:
```csv
title,company,location,job_type,posted_by,posted_date,deadline,compensation,category,description
Senior Attorney,Smith & Associates,New York NY,Full-time,John Smith,2025-10-01,2025-11-01,$150000-$180000/year,Corporate,Seeking an experienced corporate attorney...
Junior Paralegal,Johnson Law,Remote,Part-time,Sarah Johnson,2025-10-05,2025-10-30,$25/hour,Litigation,Entry-level paralegal position...
```

## How to Use

### Step 1: Place Your CSV File
Place your CSV file in the `scripts` directory and name it `jobs.csv`:
```
project/
├── scripts/
│   ├── jobs.csv        <-- Your CSV file goes here
│   ├── import-jobs.js
│   └── README.md
```

### Step 2: Run the Import
Execute the import script:
```bash
npm run import-jobs
```

### Step 3: Monitor Progress
The script will display:
- Total records found in CSV
- Validation results
- Import progress with batch updates
- Final summary statistics

## What the Script Does

1. **Reads CSV**: Parses your CSV file with automatic encoding detection
2. **Validates Data**: Checks for required fields (title, company, description)
3. **Clears Old Data**: Removes all existing jobs from the database
4. **Transforms Data**: Converts CSV rows to database format with defaults:
   - `tier_requirement`: 'free'
   - `status`: 'active'
   - `source`: 'manual'
   - `views_count`: 0
   - `applications_count`: 0
5. **Batch Import**: Imports in batches of 500 for optimal performance
6. **Error Handling**: Retries failed records individually
7. **Progress Tracking**: Shows real-time import progress

## Expected Performance

- **20,000 jobs**: ~2-5 minutes depending on network speed
- **Batch size**: 500 records per batch
- **Average speed**: 100-200 jobs/second

## Troubleshooting

### CSV File Not Found
- Ensure `jobs.csv` is in the `scripts/` directory
- Check file name spelling and extension

### Missing Environment Variables
- Verify `.env` file exists in project root
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### Validation Errors
- Check that required fields (title, company, description) are not empty
- Ensure CSV has proper header row with column names

### Import Failures
- Check network connection to Supabase
- Verify Supabase database is accessible
- Review error messages for specific issues

### Date Format Issues
- Use YYYY-MM-DD format for dates
- Common formats like MM/DD/YYYY are also supported
- Invalid dates will be set to null (optional fields)

## Re-running the Import

To re-import data:
1. Update your `jobs.csv` file
2. Run `npm run import-jobs` again
3. The script will automatically clear old data before importing

**Warning**: This script deletes ALL existing jobs in the database before importing. Make sure your CSV file contains all the data you want.

## After Import

1. Verify the import was successful by checking the summary
2. Test your Jobs page at `/jobs` to see the imported data
3. Check that search, filtering, and sorting work correctly
4. Verify tier-based access shows appropriate jobs

## Notes

- The script sets all imported jobs to `tier_requirement: 'free'` by default
- All jobs are set to `status: 'active'` so they appear immediately
- Existing database indexes will optimize search and filtering performance
- Row Level Security (RLS) policies remain active and functional
