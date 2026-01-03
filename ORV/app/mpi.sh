#!/bin/bash

set -e

WORKER_IP=""
SSH_PORT=2222
NUM_PROCS=4
MODE=""

usage() {
    echo "Usage: $0 [build|worker|master|server|cleanup|full|setup-worker-ssh] [options]"
    echo ""
    echo "Commands:"
    echo "  build              Build all images"
    echo "  worker             Start MPI worker node"
    echo "  master             Start MPI master node (with service)"
    echo "  server             Start Flask server"
    echo "  full               Start full stack (server + master)"
    echo "  setup-worker-ssh   Copy SSH keys to worker (requires worker IP)"
    echo "  cleanup            Stop and remove all containers"
    echo ""
    echo "Options:"
    echo "  --worker-ip IP     Worker IP address"
    echo "  --ssh-port PORT    SSH port (default: 2222)"
    exit 1
}

build() {
    echo "Building Docker images..."
    mkdir -p scripts
    
    docker build -f Dockerfile.server -t face-server .
    docker build -f Dockerfile.mpi -t mpi-node .
    
    echo "Build complete!"
}

start_worker() {
    echo "Starting MPI worker on port $SSH_PORT..."
    docker run -d \
        --name mpi_worker \
        --net=host \
        -v $(pwd)/scripts:/app/scripts \
        mpi-node /usr/sbin/sshd -D -p $SSH_PORT
    echo "Worker started on port $SSH_PORT"
}

start_master() {
    echo "Starting MPI master with service..."
    
    mkdir -p work ssh_keys
    
    if [ ! -f ssh_keys/id_rsa ]; then
        echo "Generating SSH keys..."
        ssh-keygen -t rsa -N '' -f ssh_keys/id_rsa -q
        chmod 600 ssh_keys/id_rsa
        chmod 644 ssh_keys/id_rsa.pub
    fi
    
    docker run -d \
        --name mpi_master \
        --net=host \
        -v $(pwd)/scripts:/app/scripts:ro \
        -v $(pwd)/work:/app/work \
        -v $(pwd)/ssh_keys:/root/.ssh \
        mpi-node bash -c "/usr/sbin/sshd && python3 /app/scripts/mpi_service.py"
    
    echo "MPI master started - http://localhost:5001"
    
    sleep 3
    
    if [ -f ssh_keys/id_rsa.pub ]; then
        echo ""
        echo "SSH public key:"
        cat ssh_keys/id_rsa.pub
        echo ""
    fi
}

start_server() {
    echo "Starting Flask server..."
    docker run -d \
        --name face_server \
        --net=host \
        -e MPI_SERVICE_URL=http://localhost:5001 \
        -v $(pwd)/data:/app/data \
        face-server
    
    echo "Server started - http://localhost:5000"
}

start_full() {
    echo "Starting full stack..."
    start_master
    sleep 2
    start_server
    echo ""
    echo "Face API: http://localhost:5000"
    echo "MPI Service: http://localhost:5001"
    echo ""
    if [ -f scripts/hostfile ]; then
        echo "Hostfile:"
        cat scripts/hostfile | sed 's/^/  /'
    fi
    echo ""
}

setup_worker_ssh() {
    if [ -z "$WORKER_IP" ]; then
        echo "Error: --worker-ip required"
        exit 1
    fi
    
    echo "Setting up SSH to worker at $WORKER_IP:$SSH_PORT..."
    
    if ! docker ps | grep -q mpi_master; then
        echo "Error: MPI master not running"
        exit 1
    fi
    
    if [ ! -f ssh_keys/id_rsa.pub ]; then
        echo "Error: SSH keys not found"
        exit 1
    fi
    
    PUBKEY=$(cat ssh_keys/id_rsa.pub)
    
    docker exec mpi_master bash -c "apt-get update -qq && apt-get install -y -qq sshpass > /dev/null 2>&1"
    
    echo "Copying key to worker..."
    COPY_RESULT=$(docker exec mpi_master bash -c "
        sshpass -p 'mpi' ssh-copy-id -p $SSH_PORT -o StrictHostKeyChecking=no root@$WORKER_IP 2>&1
    " || echo "FAILED")
    
    if [[ "$COPY_RESULT" == *"FAILED"* ]] || [[ "$COPY_RESULT" == *"Permission denied"* ]]; then
        echo ""
        echo "Automatic setup failed. Manual setup on WORKER:"
        echo ""
        echo "docker exec mpi_worker bash -c '"
        echo "mkdir -p /root/.ssh"
        echo "cat > /root/.ssh/authorized_keys << '\"'\"'EOF'\"'\"'"
        echo "$PUBKEY"
        echo "EOF"
        echo "chmod 600 /root/.ssh/authorized_keys"
        echo "chmod 700 /root/.ssh"
        echo "'"
        echo ""
        exit 1
    fi
    
    echo "Testing connection..."
    TEST_RESULT=$(docker exec mpi_master bash -c "ssh -p $SSH_PORT -o StrictHostKeyChecking=no root@$WORKER_IP 'echo SSH_OK' 2>&1" || echo "FAILED")
    
    if [[ "$TEST_RESULT" == *"SSH_OK"* ]]; then
        echo "✓ SSH connection verified!"
        echo ""
        echo "Update scripts/hostfile:"
        echo "  localhost slots=2"
        echo "  root@$WORKER_IP slots=2"
        echo ""
    else
        echo "✗ SSH test failed: $TEST_RESULT"
        exit 1
    fi
}

show_ssh_key() {
    if [ -f ssh_keys/id_rsa.pub ]; then
        echo "SSH Public Key:"
        cat ssh_keys/id_rsa.pub
        echo ""
    else
        echo "No SSH key found. Start master first."
    fi
}

cleanup() {
    echo "Cleaning up..."
    docker stop face_server mpi_master mpi_worker 2>/dev/null || true
    docker rm face_server mpi_master mpi_worker 2>/dev/null || true
    echo "Cleanup complete!"
}

if [ $# -eq 0 ]; then
    usage
fi

MODE=$1
shift

while [[ $# -gt 0 ]]; do
    case $1 in
        --worker-ip)
            WORKER_IP="$2"
            shift 2
            ;;
        --ssh-port)
            SSH_PORT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

case $MODE in
    build)
        build
        ;;
    worker)
        start_worker
        ;;
    master)
        start_master
        ;;
    server)
        start_server
        ;;
    full)
        start_full
        ;;
    setup-worker-ssh)
        setup_worker_ssh
        ;;
    show-key)
        show_ssh_key
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Unknown command: $MODE"
        usage
        ;;
esac