# tasks/__init__.py
#
# This package is the Locust shared tasks namespace.
# All task logic is currently defined inline in locustfile.py and soak_locustfile.py
# as @task methods on the HttpUser classes (the simplest structure for a single-file run).
#
# To split tasks into modules as the test suite grows, add files here:
#   auth_tasks.py    — register, login, refresh, logout flows
#   project_tasks.py — project CRUD + member management
#   task_tasks.py    — task CRUD + status transitions + comments
#   notif_tasks.py   — notification read/mark-all-read
#
# Then import them in locustfile.py with:
#   from tasks.auth_tasks import auth_task_set
