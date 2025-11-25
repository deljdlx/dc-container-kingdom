/**
 * Mock data for testing the Container Kingdom frontend without Docker
 * This file contains sample Docker API responses
 */

const MockData = {
  /**
   * Mock container list response (from /containers/json?all=true)
   * Format: Array of container descriptors
   */
  containers: [
    {
      "Id": "1c9f8952c0601312bb9f1720b860c770beec445c748871e8dbf8f5f3d79c7727",
      "Names": ["/thirsty-ai"],
      "Image": "nginx:latest",
      "ImageID": "sha256:abc123def456",
      "Command": "nginx -g 'daemon off;'",
      "Created": Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      "Ports": [
        { "IP": "0.0.0.0", "PrivatePort": 80, "PublicPort": 8080, "Type": "tcp" }
      ],
      "Labels": {
        "com.docker.compose.project": "my-web-project",
        "traefik.http.routers.thirsty-ai.rule": "Host(`thirsty-ai.example.com`)"
      },
      "State": "running",
      "Status": "Up 1 day",
      "HostConfig": { "NetworkMode": "web" },
      "NetworkSettings": {
        "Networks": {
          "web": {
            "IPAMConfig": null,
            "Links": null,
            "Aliases": null,
            "NetworkID": "net123",
            "EndpointID": "ep123",
            "Gateway": "172.18.0.1",
            "IPAddress": "172.18.0.2",
            "IPPrefixLen": 16,
            "IPv6Gateway": "",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "MacAddress": "02:42:ac:12:00:02"
          }
        }
      },
      "Mounts": []
    },
    {
      "Id": "2d8a9b53c1602413cc0f2831c961d881cffd556d859982f9ecf9f604e80d8838",
      "Names": ["/clever-database"],
      "Image": "postgres:15",
      "ImageID": "sha256:def789abc012",
      "Command": "docker-entrypoint.sh postgres",
      "Created": Math.floor(Date.now() / 1000) - 172800, // 2 days ago
      "Ports": [
        { "IP": "0.0.0.0", "PrivatePort": 5432, "PublicPort": 5432, "Type": "tcp" }
      ],
      "Labels": {
        "com.docker.compose.project": "my-web-project"
      },
      "State": "running",
      "Status": "Up 2 days",
      "HostConfig": { "NetworkMode": "default" },
      "NetworkSettings": {
        "Networks": {
          "web": {
            "IPAMConfig": null,
            "Links": null,
            "Aliases": null,
            "NetworkID": "net123",
            "EndpointID": "ep124",
            "Gateway": "172.18.0.1",
            "IPAddress": "172.18.0.3",
            "IPPrefixLen": 16,
            "IPv6Gateway": "",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "MacAddress": "02:42:ac:12:00:03"
          },
          "backend": {
            "IPAMConfig": null,
            "Links": null,
            "Aliases": null,
            "NetworkID": "net456",
            "EndpointID": "ep125",
            "Gateway": "172.19.0.1",
            "IPAddress": "172.19.0.2",
            "IPPrefixLen": 16,
            "IPv6Gateway": "",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "MacAddress": "02:42:ac:13:00:02"
          }
        }
      },
      "Mounts": []
    },
    {
      "Id": "3e9b0c64d2703524dd103942d072e992d00e667e9600930fdf007b5f91e9949a",
      "Names": ["/happy-redis"],
      "Image": "redis:7-alpine",
      "ImageID": "sha256:ghi345jkl678",
      "Command": "docker-entrypoint.sh redis-server",
      "Created": Math.floor(Date.now() / 1000) - 259200, // 3 days ago
      "Ports": [
        { "IP": "0.0.0.0", "PrivatePort": 6379, "PublicPort": 6379, "Type": "tcp" }
      ],
      "Labels": {
        "com.docker.compose.project": "my-web-project"
      },
      "State": "running",
      "Status": "Up 3 days",
      "HostConfig": { "NetworkMode": "backend" },
      "NetworkSettings": {
        "Networks": {
          "backend": {
            "IPAMConfig": null,
            "Links": null,
            "Aliases": null,
            "NetworkID": "net456",
            "EndpointID": "ep126",
            "Gateway": "172.19.0.1",
            "IPAddress": "172.19.0.3",
            "IPPrefixLen": 16,
            "IPv6Gateway": "",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "MacAddress": "02:42:ac:13:00:03"
          }
        }
      },
      "Mounts": []
    },
    {
      "Id": "4f0c1d75e3814635ee2a4053e183f003eaaf778f071104a1beb1a8c6b02f0050",
      "Names": ["/sleepy-worker"],
      "Image": "python:3.11-slim",
      "ImageID": "sha256:jkl901mno234",
      "Command": "python worker.py",
      "Created": Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      "Ports": [],
      "Labels": {
        "com.docker.compose.project": "background-jobs"
      },
      "State": "exited",
      "Status": "Exited (0) 1 hour ago",
      "HostConfig": { "NetworkMode": "worker-net" },
      "NetworkSettings": {
        "Networks": {
          "worker-net": {
            "IPAMConfig": null,
            "Links": null,
            "Aliases": null,
            "NetworkID": "net789",
            "EndpointID": "",
            "Gateway": "",
            "IPAddress": "",
            "IPPrefixLen": 0,
            "IPv6Gateway": "",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "MacAddress": ""
          }
        }
      },
      "Mounts": []
    },
    {
      "Id": "501d2e86f4925746ff3c5164f294a114fcca889c182215c2afa2c9d7a13a1161",
      "Names": ["/traefik-proxy"],
      "Image": "traefik:v2.10",
      "ImageID": "sha256:mno567pqr890",
      "Command": "traefik",
      "Created": Math.floor(Date.now() / 1000) - 604800, // 7 days ago
      "Ports": [
        { "IP": "0.0.0.0", "PrivatePort": 80, "PublicPort": 80, "Type": "tcp" },
        { "IP": "0.0.0.0", "PrivatePort": 443, "PublicPort": 443, "Type": "tcp" },
        { "IP": "0.0.0.0", "PrivatePort": 8080, "PublicPort": 8081, "Type": "tcp" }
      ],
      "Labels": {
        "com.docker.compose.project": "infrastructure",
        "traefik.http.routers.traefik.rule": "Host(`traefik.example.com`)"
      },
      "State": "running",
      "Status": "Up 7 days",
      "HostConfig": { "NetworkMode": "web" },
      "NetworkSettings": {
        "Networks": {
          "web": {
            "IPAMConfig": null,
            "Links": null,
            "Aliases": null,
            "NetworkID": "net123",
            "EndpointID": "ep127",
            "Gateway": "172.18.0.1",
            "IPAddress": "172.18.0.100",
            "IPPrefixLen": 16,
            "IPv6Gateway": "",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "MacAddress": "02:42:ac:12:00:64"
          }
        }
      },
      "Mounts": []
    }
  ],

  /**
   * Generate mock stats for a container
   * Format matches Docker stats API response
   * @param {string} containerId - Container ID
   * @param {string} containerName - Container name
   * @returns {Object} Mock stats object
   */
  generateContainerStats: function(containerId, containerName) {
    const now = new Date().toISOString();
    const preread = new Date(Date.now() - 1000).toISOString();

    // Generate random but reasonable values
    const memoryUsage = Math.floor(Math.random() * 500000000) + 10000000; // 10MB to 500MB
    const memoryLimit = 4101214208; // ~4GB
    const cpuTotalUsage = Math.floor(Math.random() * 1000000000) + 100000000;
    const systemCpuUsage = Math.floor(Date.now() * 1000000);
    const onlineCpus = 2;

    return {
      "read": now,
      "preread": preread,
      "pids_stats": {
        "current": Math.floor(Math.random() * 10) + 1,
        "limit": 4639
      },
      "blkio_stats": {
        "io_service_bytes_recursive": [
          { "major": 8, "minor": 0, "op": "read", "value": Math.floor(Math.random() * 1000000) },
          { "major": 8, "minor": 0, "op": "write", "value": Math.floor(Math.random() * 5000000) }
        ],
        "io_serviced_recursive": null,
        "io_queue_recursive": null,
        "io_service_time_recursive": null,
        "io_wait_time_recursive": null,
        "io_merged_recursive": null,
        "io_time_recursive": null,
        "sectors_recursive": null
      },
      "num_procs": 0,
      "storage_stats": {},
      "cpu_stats": {
        "cpu_usage": {
          "total_usage": cpuTotalUsage,
          "usage_in_kernelmode": Math.floor(cpuTotalUsage * 0.4),
          "usage_in_usermode": Math.floor(cpuTotalUsage * 0.6)
        },
        "system_cpu_usage": systemCpuUsage,
        "online_cpus": onlineCpus,
        "throttling_data": {
          "periods": 0,
          "throttled_periods": 0,
          "throttled_time": 0
        }
      },
      "precpu_stats": {
        "cpu_usage": {
          "total_usage": cpuTotalUsage - Math.floor(Math.random() * 10000000),
          "usage_in_kernelmode": Math.floor(cpuTotalUsage * 0.4),
          "usage_in_usermode": Math.floor(cpuTotalUsage * 0.6)
        },
        "system_cpu_usage": systemCpuUsage - 2430000000,
        "online_cpus": onlineCpus,
        "throttling_data": {
          "periods": 0,
          "throttled_periods": 0,
          "throttled_time": 0
        }
      },
      "memory_stats": {
        "usage": memoryUsage,
        "stats": {
          "active_anon": Math.floor(memoryUsage * 0.3),
          "active_file": Math.floor(memoryUsage * 0.05),
          "anon": Math.floor(memoryUsage * 0.4),
          "anon_thp": 0,
          "file": Math.floor(memoryUsage * 0.1),
          "file_dirty": 0,
          "file_mapped": 4096,
          "file_writeback": 0,
          "inactive_anon": Math.floor(memoryUsage * 0.3),
          "inactive_file": Math.floor(memoryUsage * 0.05),
          "kernel_stack": 49152,
          "pgactivate": 115,
          "pgdeactivate": 21,
          "pgfault": 2408,
          "pglazyfree": 0,
          "pglazyfreed": 0,
          "pgmajfault": 0,
          "pgrefill": 21,
          "pgscan": 1440,
          "pgsteal": 399,
          "shmem": 4096,
          "slab": 418640,
          "slab_reclaimable": 218928,
          "slab_unreclaimable": 199712,
          "sock": 0,
          "thp_collapse_alloc": 0,
          "thp_fault_alloc": 1,
          "unevictable": 0,
          "workingset_activate": 0,
          "workingset_nodereclaim": 0,
          "workingset_refault": 0
        },
        "limit": memoryLimit
      },
      "name": containerName,
      "id": containerId,
      "networks": {
        "eth0": {
          "rx_bytes": Math.floor(Math.random() * 10000000),
          "rx_packets": Math.floor(Math.random() * 100000),
          "rx_errors": 0,
          "rx_dropped": 0,
          "tx_bytes": Math.floor(Math.random() * 5000000),
          "tx_packets": Math.floor(Math.random() * 50000),
          "tx_errors": 0,
          "tx_dropped": 0
        }
      }
    };
  },

  /**
   * Generate mock logs for a container
   * @returns {string} Mock log output
   */
  generateContainerLogs: function() {
    const logLines = [
      "[INFO] Container started successfully",
      "[INFO] Listening on port 80",
      "[DEBUG] Health check passed",
      "[INFO] Processing request from 172.18.0.1",
      "[INFO] Request completed in 45ms",
      "[DEBUG] Memory usage: 128MB",
      "[INFO] Connection established",
      "[WARN] High latency detected: 200ms",
      "[INFO] Cache hit ratio: 85%",
      "[DEBUG] Background task completed"
    ];

    // Return random subset of logs
    const numLogs = Math.floor(Math.random() * 8) + 3;
    const selectedLogs = [];
    for (let i = 0; i < numLogs; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 3600000).toISOString();
      const logLine = logLines[Math.floor(Math.random() * logLines.length)];
      selectedLogs.push(`${timestamp} ${logLine}`);
    }
    return selectedLogs.join('\n');
  }
};
