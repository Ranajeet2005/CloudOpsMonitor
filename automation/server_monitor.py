
import json
import platform
import socket
import time
import logging

from datetime import datetime, timezone

import psutil


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)


class CloudOpsAutomation:

    def __init__(self, interval=10):

        self.interval = interval
        self.hostname = socket.gethostname()

    def collect_metrics(self):

        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        metrics = {
            "hostname": self.hostname,
            "platform": platform.system(),
            "cpu_usage": psutil.cpu_percent(interval=1),
            "memory_usage": memory.percent,
            "disk_usage": disk.percent,
            "timestamp": datetime.now(
                timezone.utc
            ).isoformat()
        }

        return metrics

    def monitor(self):

        logging.info("CloudOpsMonitor automation started")

        while True:

            try:

                metrics = self.collect_metrics()

                logging.info(
                    "Server Metrics: %s",
                    json.dumps(metrics)
                )

            except Exception as error:

                logging.exception(
                    "Monitoring failed: %s",
                    error
                )

            time.sleep(self.interval)


if __name__ == "__main__":

    agent = CloudOpsAutomation(interval=10)

    agent.monitor()
