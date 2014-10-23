test:
	@node node_modules/lab/bin/lab -a code -fL
test-cov:
	@node node_modules/lab/bin/lab -a code -fL -t 100
test-cov-html:
	@node node_modules/lab/bin/lab -a code -fL -r html -o coverage.html

.PHONY: test test-cov test-cov-html
