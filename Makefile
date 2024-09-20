.PHONY: start

start:
	# Ensure the shell script is executable
	chmod +x start_servers.sh

	# Call the shell script to start and manage servers
	./start_servers.sh
