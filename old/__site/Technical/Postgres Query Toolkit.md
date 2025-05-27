
This page has some queries I find myself returning to over and over again.

## Finding long running queries

```sql
SELECT  
  pid,  
  wait_event,
  wait_event_type,
  now() - pg_stat_activity.query_start AS duration,  
  query,  
  state  
FROM pg_stat_activity  
WHERE (now() - pg_stat_activity.query_start) > interval '10 seconds'
  and state <> 'idle';
```


If your queries are really long (textually):
```sql
SELECT  
  pid,  
  wait_event,
  wait_event_type,
  now() - pg_stat_activity.query_start AS duration,  
  substring(query from 0 for 100) as query,  
  state  
FROM pg_stat_activity  
WHERE (now() - pg_stat_activity.query_start) > interval '10 seconds'
  and state <> 'idle';
```

Note that these queries *filter out* idle connections. If that's something you care about, include that. I usually don't care about that.

## Autovaccuum and Dead Tuples

**Measuring dead tuple counts and percents**:

```sql
select
  schemaname,
  relname,
  n_live_tup,
  n_dead_tup, 
  (n_dead_tup / (n_live_tup + n_dead_tup)::float) * 100 as percent_dead
from pg_stat_user_tables
where (n_live_tup + n_dead_tup) > 0
order by 4 desc;
```

**Checking when autovacuum was last run:**

```sql
select 
  relname,
  greatest(last_vacuum, last_autovacuum) as last_any_vacuum,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
from pg_stat_user_tables
where true
  -- and relname = 'X;
  -- and schemaname = 'Y';
order by 2 asc;
```

**Version of the above with intervals (easier to read in my opinion):**

```sql
select 
  relname,
  now() - greatest(last_vacuum, last_autovacuum) as last_any_vacuum,
  now() - last_vacuum as last_vacuum,
  now() - last_autovacuum as last_autovacuum,
  now() - last_analyze as last_analyze,
  now() - last_autoanalyze as last_autoanalyze
from pg_stat_user_tables
where true
  -- and relname = 'X;
  -- and schemaname = 'Y';
order by 2 asc;
```

**Dead tuples and last any vacuum combined**:

```sql
select 
  relname,
  now() - greatest(last_vacuum, last_autovacuum) as last_any_vacuum,
  n_live_tup,
  n_dead_tup, 
  case when n_live_tup + n_dead_tup = 0 then
    0
  else 
    (n_dead_tup / (n_live_tup + n_dead_tup)::float)
  end as percent_dead
from pg_stat_user_tables
where true
  -- and relname = 'X;
  -- and schemaname = 'Y';
order by 2 asc;
-- maybe you want order by 5 desc;
```

# Index Usage

```sql
SELECT
    t.schemaname,
    t.tablename,
    c.reltuples::bigint                            AS num_rows,
    pg_size_pretty(pg_relation_size(c.oid))        AS table_size,
    psai.indexrelname                              AS index_name,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
    CASE WHEN i.indisunique THEN 'Y' ELSE 'N' END  AS "unique",
    psai.idx_scan                                  AS number_of_scans,
    psai.idx_tup_read                              AS tuples_read,
    psai.idx_tup_fetch                             AS tuples_fetched
FROM
    pg_tables t
    LEFT JOIN pg_class c ON t.tablename = c.relname
    LEFT JOIN pg_index i ON c.oid = i.indrelid
    LEFT JOIN pg_stat_all_indexes psai ON i.indexrelid = psai.indexrelid
WHERE
    t.schemaname NOT IN ('pg_catalog', 'information_schema')
    and t.tablename = '<MY TABLE NAME>' -- uncomment this to see all
ORDER BY 1, 2;
```

