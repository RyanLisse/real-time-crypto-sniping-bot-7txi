.PHONY: kill-ports backend frontend dev

# Ports used by this app:
# - 4000: Encore backend API
# - 9400: Encore dashboard
# - 3000: Next.js frontend
PORTS := 3000 4000 9400

kill-ports:
	@echo "Killing processes on ports: $(PORTS) (if any)"
	@for port in $(PORTS); do \
	  if lsof -ti :$$port > /dev/null 2>&1; then \
	    echo "- Killing processes on port $$port"; \
	    lsof -ti :$$port | xargs kill -9 || true; \
	  else \
	    echo "- No process on port $$port"; \
	  fi; \
	done

backend:
	cd backend && encore run

frontend:
	cd frontend && bun dev

# Convenience target: kill ports, then start backend and frontend together.
# Note: both commands are long-running; this target will keep the shell busy.
dev: kill-ports
	$(MAKE) -j2 backend frontend
