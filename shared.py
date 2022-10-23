
import traceback


def my_exec_info_message(exec_info):
  traceback_result = traceback.format_tb(exec_info[2])
  if isinstance(traceback_result, list):
    traceback_result = "\n".join(traceback_result)

  return f"{exec_info[0].__module__}.{exec_info[0].__name__}: {exec_info[1]}: {traceback_result}"
