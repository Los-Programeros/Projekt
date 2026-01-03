./mpi.sh cleanup
./mpi.sh build
./mpi.sh full
./mpi.sh setup-worker-ssh --worker-ip 100.105.86.53 --ssh-port 2222

./mpi.sh cleanup
./mpi.sh build
./mpi.sh worker --ssh-port 2222