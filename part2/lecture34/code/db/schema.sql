CREATE TABLE seats (
  performance_id integer NOT NULL,
  id text NOT NULL,
  zone text NOT NULL,
  row_no integer NOT NULL,
  seat_no integer NOT NULL,
  status text NOT NULL,
  PRIMARY KEY (performance_id, id)
);
