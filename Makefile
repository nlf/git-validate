test:
	@node node_modules/lab/bin/lab -a code -L
test-cov:
	@node node_modules/lab/bin/lab -a code -L -t 100
test-cov-html:
	@node node_modules/lab/bin/lab -a code -L -r html -o coverage.html

.PHONY: test test-cov test-cov-html
