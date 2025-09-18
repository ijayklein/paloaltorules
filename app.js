/**
 * Palo Alto Planning & Validation Web Application
 * Interactive interface for both planning and validation workflows
 */

class PlanningValidationApp {
    constructor() {
        this.planningEngine = new PlanningEngine();
        this.validationEngine = new ValidationEngine();
        this.currentMode = 'planning';
        this.currentWorkflow = null;
        this.templates = this.loadTemplates();

        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.loadTemplates();
        this.setupModeToggle();
    }

    setupEventListeners() {
        // Mode switching - more robust event handling
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const mode = e.target.closest('.mode-btn').dataset.mode;
                console.log('Mode button clicked:', mode);
                this.switchMode(mode);
            });
        });

        // Form submissions
        document.getElementById('planningForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePlanningSubmission();
        });

        document.getElementById('validationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleValidationSubmission();
        });

        // Template management
        document.getElementById('templatesBtn').addEventListener('click', () => {
            this.showTemplateModal();
        });

        document.getElementById('closeTemplateModal').addEventListener('click', () => {
            this.hideTemplateModal();
        });

        document.getElementById('saveTemplateBtn').addEventListener('click', () => {
            this.showTemplateModal('save');
        });

        document.getElementById('loadTemplateBtn').addEventListener('click', () => {
            this.showTemplateModal('load');
        });

        document.getElementById('saveValidationTemplateBtn').addEventListener('click', () => {
            this.showTemplateModal('save');
        });

        document.getElementById('loadValidationTemplateBtn').addEventListener('click', () => {
            this.showTemplateModal('load');
        });

        document.getElementById('saveNewTemplate').addEventListener('click', () => {
            this.saveTemplate();
        });

        // Report generation buttons
        document.getElementById('generatePlanningReport')?.addEventListener('click', () => {
            this.generatePlanningReport();
        });

        document.getElementById('generateValidationReport')?.addEventListener('click', () => {
            this.generateValidationReport();
        });

        // Template tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTemplateTab(e.target.dataset.tab);
            });
        });

        // Modal backdrop click
        document.getElementById('templateModal').addEventListener('click', (e) => {
            if (e.target.id === 'templateModal') {
                this.hideTemplateModal();
            }
        });

        // Form field changes for validation
        this.setupFormValidation();
    }

    setupFormValidation() {
        // Zone change handler for both forms
        document.querySelectorAll('select[name="zone"]').forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateZoneSpecificFields(e.target.value, e.target.form);
            });
        });

        // Lot size change handler
        document.querySelectorAll('input[name="lotSize"]').forEach(input => {
            input.addEventListener('input', (e) => {
                this.validateLotSize(e.target.value, e.target.form);
            });
        });

        // Corner lot checkbox handler
        document.querySelectorAll('input[name="isCornerLot"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleCornerLotFields(e.target.checked, e.target.form);
            });
        });

        // Second unit checkbox handler
        document.querySelectorAll('input[name="hasSecondUnit"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleSecondUnitFields(e.target.checked, e.target.form);
            });
        });
    }

    setupModeToggle() {
        console.log('Setting up mode toggle, current mode:', this.currentMode);

        // Ensure initial state is set correctly
        this.switchMode(this.currentMode);

        // Add some debugging
        const planningMode = document.getElementById('planningMode');
        const validationMode = document.getElementById('validationMode');

        console.log('Planning mode element:', planningMode ? 'found' : 'not found');
        console.log('Validation mode element:', validationMode ? 'found' : 'not found');
    }

    switchMode(mode) {
        console.log('switchMode called with mode:', mode);
        console.log('current mode:', this.currentMode);

        if (!mode) {
            console.error('No mode provided to switchMode');
            return;
        }

        // Force update even if same mode to fix display issues
        this.currentMode = mode;

        // Update mode buttons - more explicit approach
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });

        // Update mode content - more explicit approach
        document.querySelectorAll('.mode-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        // Show the selected mode content
        const targetContent = document.getElementById(`${mode}Mode`);
        if (targetContent) {
            targetContent.classList.add('active');
            targetContent.style.display = 'block';
            console.log('Activated content:', targetContent.id);
        } else {
            console.error('Could not find content element for mode:', mode);
        }

        // Reset any ongoing workflows
        this.resetWorkflow();

        // Force a repaint
        setTimeout(() => {
            const activeContent = document.querySelector('.mode-content.active');
            if (activeContent) {
                activeContent.style.opacity = '0';
                setTimeout(() => {
                    activeContent.style.opacity = '1';
                }, 10);
            }
        }, 10);
    }

    resetWorkflow() {
        this.currentWorkflow = null;

        // Hide progress indicators
        document.getElementById('planningProgress').style.display = 'none';
        document.getElementById('validationProgress').style.display = 'none';

        // Clear results
        this.clearResults();
    }

    clearResults() {
        const planningResults = document.getElementById('planningResults');
        const validationResults = document.getElementById('validationResults');

        planningResults.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3 class="empty-title">Ready for Planning</h3>
                <p class="empty-text">Enter site information and click "Start Planning" to begin the 5-phase design workflow.</p>
            </div>
        `;

        validationResults.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <h3 class="empty-title">Ready for Validation</h3>
                <p class="empty-text">Enter design information and click "Validate Design" to check compliance with zoning requirements.</p>
            </div>
        `;
    }

    handlePlanningSubmission() {
        const formData = this.getFormData('planningForm');

        if (!this.validatePlanningInput(formData)) {
            return;
        }

        const siteData = this.formatSiteDataForPlanning(formData);

        this.showPlanningProgress();
        this.executePlanningWorkflow(siteData);
    }

    handleValidationSubmission() {
        const formData = this.getFormData('validationForm');

        if (!this.validateValidationInput(formData)) {
            return;
        }

        const { siteData, designData } = this.formatDataForValidation(formData);

        this.showValidationProgress();
        this.executeValidationWorkflow(siteData, designData);
    }

    getFormData(formIdOrMode) {
        // Handle both form ID and mode strings
        let formId = formIdOrMode;
        if (formIdOrMode === 'planning') formId = 'planningForm';
        if (formIdOrMode === 'validation') formId = 'validationForm';

        const form = document.getElementById(formId);
        if (!form) return {};
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            if (form.querySelector(`input[name="${key}"][type="checkbox"]`)) {
                data[key] = form.querySelector(`input[name="${key}"]`).checked;
            } else if (form.querySelector(`input[name="${key}"][type="number"]`)) {
                data[key] = parseFloat(value) || 0;
            } else {
                data[key] = value;
            }
        }

        return data;
    }

    validatePlanningInput(data) {
        const errors = [];

        if (!data.address) errors.push('Property address is required');
        if (!data.zone) errors.push('Zone district is required');
        if (!data.lotSize || data.lotSize < 1000) errors.push('Valid lot size is required (minimum 1000 sq ft)');

        if (errors.length > 0) {
            this.showValidationErrors(errors);
            return false;
        }

        return true;
    }

    validateValidationInput(data) {
        const errors = [];

        if (!data.address) errors.push('Property address is required');
        if (!data.zone) errors.push('Zone district is required');
        if (!data.lotSize || data.lotSize < 1000) errors.push('Valid lot size is required');
        if (!data.buildingHeight || data.buildingHeight <= 0) errors.push('Building height is required');
        if (!data.totalFloorArea || data.totalFloorArea <= 0) errors.push('Total floor area is required');

        if (errors.length > 0) {
            this.showValidationErrors(errors);
            return false;
        }

        return true;
    }

    showValidationErrors(errors) {
        const errorHtml = errors.map(error =>
            `<div class="violation-item">
                <div class="violation-icon">⚠️</div>
                <div class="violation-content">
                    <div class="violation-description">${error}</div>
                </div>
            </div>`
        ).join('');

        const resultsContainer = this.currentMode === 'planning'
            ? document.getElementById('planningResults')
            : document.getElementById('validationResults');

        resultsContainer.innerHTML = `
            <div class="phase-result error">
                <h3 class="phase-title">Input Validation Errors</h3>
                <div class="phase-summary">Please correct the following errors:</div>
                ${errorHtml}
            </div>
        `;
    }

    formatSiteDataForPlanning(formData) {
        return {
            address: formData.address,
            apn: formData.apn || '',
            zone: formData.zone,
            lotSize: formData.lotSize,
            lotType: formData.lotType || 'typical',
            isCornerLot: formData.isCornerLot || false,
            creekAreas: formData.creekAreas || 0,
            easements: formData.easements || 0,
            historicCategory: formData.historicCategory || null,
            hasSecondUnit: formData.hasSecondUnit || false
        };
    }

    formatDataForValidation(formData) {
        const siteData = {
            address: formData.address,
            zone: formData.zone,
            lotSize: formData.lotSize,
            lotType: formData.lotType || 'typical',
            isCornerLot: formData.isCornerLot || false,
            creekAreas: formData.creekAreas || 0,
            easements: formData.easements || 0,
            historicCategory: formData.historicCategory || null
        };

        const designData = {
            submittedZone: formData.zone,
            buildingHeight: formData.buildingHeight,
            totalFloorArea: formData.totalFloorArea,
            floors: parseInt(formData.floors) || 1,
            totalCoverage: formData.totalCoverage,
            frontSetback: formData.frontSetback,
            interiorSideSetback: formData.interiorSideSetback,
            streetSideSetback: formData.streetSideSetback || null,
            rearSetback: formData.rearSetback,
            parkingSpaces: formData.parkingSpaces,
            coveredParkingSpaces: formData.coveredParkingSpaces,
            drivewaySurfaceWidth: formData.drivewaySurfaceWidth || 8,
            drivewayClearanceWidth: formData.drivewayClearanceWidth || 10,
            backingDistance: formData.backingDistance || 18,
            hasSecondUnit: formData.hasSecondUnit || false,
            hasPool: formData.hasPool || false,
            hasGarage: formData.hasGarage || false,
            daylightPlaneCompliant: formData.daylightPlaneCompliant || false,
            drivewayMaterial: 'concrete', // Default
            professionalStamps: ['Architect'], // Default
            submittedDocuments: ['site_plan', 'floor_plans'] // Default
        };

        return { siteData, designData };
    }

    showPlanningProgress() {
        const progressContainer = document.getElementById('planningProgress');
        progressContainer.style.display = 'block';

        this.updateProgress('planning', 1, 5);
        this.clearResults();
    }

    showValidationProgress() {
        const progressContainer = document.getElementById('validationProgress');
        progressContainer.style.display = 'block';

        this.updateProgress('validation', 1, 5);
        this.clearResults();
    }

    updateProgress(mode, currentPhase, totalPhases) {
        const progressPercent = (currentPhase / totalPhases) * 100;
        const phaseText = `Phase ${currentPhase} of ${totalPhases}`;

        if (mode === 'planning') {
            document.getElementById('currentPhase').textContent = phaseText;
            document.getElementById('progressFill').style.width = `${progressPercent}%`;
        } else {
            document.getElementById('validationCurrentPhase').textContent = phaseText;
            document.getElementById('validationProgressFill').style.width = `${progressPercent}%`;
        }

        // Update phase indicators
        const container = mode === 'planning' ?
            document.getElementById('planningProgress') :
            document.getElementById('validationProgress');

        container.querySelectorAll('.phase-indicator').forEach((indicator, index) => {
            const phase = index + 1;
            indicator.classList.toggle('active', phase === currentPhase);
            indicator.classList.toggle('completed', phase < currentPhase);
        });
    }

    async executePlanningWorkflow(siteData) {
        try {
            const resultsContainer = document.getElementById('planningResults');

            // Phase 1
            this.updateProgress('planning', 1, 5);
            await this.delay(500);
            const phase1Results = this.planningEngine.executePhase1(siteData);
            this.displayPhaseResult(resultsContainer, phase1Results, 'planning');

            if (phase1Results.status === 'stopped') {
                this.updateProgress('planning', 5, 5);
                return;
            }

            // Phase 2
            this.updateProgress('planning', 2, 5);
            await this.delay(500);
            const phase2Results = this.planningEngine.executePhase2(siteData, phase1Results);
            this.displayPhaseResult(resultsContainer, phase2Results, 'planning');

            // Phase 3
            this.updateProgress('planning', 3, 5);
            await this.delay(500);
            const phase3Results = this.planningEngine.executePhase3(siteData, {
                phase1: phase1Results,
                phase2: phase2Results
            });
            this.displayPhaseResult(resultsContainer, phase3Results, 'planning');

            // Phase 4
            this.updateProgress('planning', 4, 5);
            await this.delay(500);
            const phase4Results = this.planningEngine.executePhase4(siteData, {
                phase1: phase1Results,
                phase2: phase2Results,
                phase3: phase3Results
            });
            this.displayPhaseResult(resultsContainer, phase4Results, 'planning');

            // Phase 5
            this.updateProgress('planning', 5, 5);
            await this.delay(500);
            const phase5Results = this.planningEngine.executePhase5(siteData, {
                phase1: phase1Results,
                phase2: phase2Results,
                phase3: phase3Results,
                phase4: phase4Results
            });
            this.displayPhaseResult(resultsContainer, phase5Results, 'planning');

            // Display final report
            this.displayFinalPlanningReport(resultsContainer, phase5Results.finalReport);

            // Store workflow results for report generation
            this.currentWorkflow = {
                type: 'planning',
                results: [phase1Results, phase2Results, phase3Results, phase4Results, phase5Results],
                finalReport: phase5Results.finalReport
            };

            // Show report generation button
            this.showReportButton('planning');

        } catch (error) {
            this.displayError('planning', error.message);
        }
    }

    async executeValidationWorkflow(siteData, designData) {
        try {
            const resultsContainer = document.getElementById('validationResults');

            // Phase 1
            this.updateProgress('validation', 1, 5);
            await this.delay(500);
            const phase1Results = this.validationEngine.executePhase1Validation(siteData, designData);
            this.displayValidationResult(resultsContainer, phase1Results);

            if (phase1Results.status === 'critical_failure') {
                this.updateProgress('validation', 5, 5);
                return;
            }

            // Phase 2
            this.updateProgress('validation', 2, 5);
            await this.delay(500);
            const phase2Results = this.validationEngine.executePhase2Validation(siteData, designData, phase1Results);
            this.displayValidationResult(resultsContainer, phase2Results);

            // Phase 3
            this.updateProgress('validation', 3, 5);
            await this.delay(500);
            const phase3Results = this.validationEngine.executePhase3Validation(siteData, designData, {
                phase1: phase1Results,
                phase2: phase2Results
            });
            this.displayValidationResult(resultsContainer, phase3Results);

            // Phase 4
            this.updateProgress('validation', 4, 5);
            await this.delay(500);
            const phase4Results = this.validationEngine.executePhase4Validation(siteData, designData, {
                phase1: phase1Results,
                phase2: phase2Results,
                phase3: phase3Results
            });
            this.displayValidationResult(resultsContainer, phase4Results);

            // Phase 5
            this.updateProgress('validation', 5, 5);
            await this.delay(500);
            const phase5Results = this.validationEngine.executePhase5Validation(siteData, designData, {
                phase1: phase1Results,
                phase2: phase2Results,
                phase3: phase3Results,
                phase4: phase4Results
            });
            this.displayValidationResult(resultsContainer, phase5Results);

            // Display final report
            this.displayFinalValidationReport(resultsContainer, phase5Results.finalReport);

            // Store workflow results for report generation
            this.currentWorkflow = {
                type: 'validation',
                results: [phase1Results, phase2Results, phase3Results, phase4Results, phase5Results],
                finalReport: phase5Results.finalReport
            };

            // Show report generation button
            this.showReportButton('validation');

        } catch (error) {
            this.displayError('validation', error.message);
        }
    }

    displayPhaseResult(container, result, mode) {
        const statusClass = result.status === 'completed' ? 'success' :
                          result.status === 'stopped' ? 'error' : 'warning';

        const tasksHtml = result.tasks.map(task => `
            <div class="task-item">
                <div class="task-status">${this.getTaskStatusIcon(task.status || 'completed')}</div>
                <div class="task-content">
                    <div class="task-name">${task.name}</div>
                    <div class="task-description">${task.message || task.required || ''}</div>
                </div>
            </div>
        `).join('');

        const recommendationsHtml = result.recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-icon">${this.getRecommendationIcon(rec.type)}</div>
                <div class="recommendation-text">${rec.message}</div>
            </div>
        `).join('');

        const constraintsHtml = result.constraints ? result.constraints.map(constraint => `
            <div class="recommendation-item">
                <div class="recommendation-icon">⚠️</div>
                <div class="recommendation-text"><strong>${constraint.type}:</strong> ${constraint.description}</div>
            </div>
        `).join('') : '';

        const phaseHtml = `
            <div class="phase-result ${statusClass}">
                <h3 class="phase-title">${result.phaseName}</h3>
                <div class="phase-summary">Status: ${result.status.replace('_', ' ').toUpperCase()}</div>

                ${tasksHtml ? `<div class="task-list">${tasksHtml}</div>` : ''}
                ${constraintsHtml ? `<div class="recommendations">${constraintsHtml}</div>` : ''}
                ${recommendationsHtml ? `<div class="recommendations">${recommendationsHtml}</div>` : ''}

                ${result.designParameters ? this.formatDesignParameters(result.designParameters) : ''}
                ${result.parkingParameters ? this.formatParkingParameters(result.parkingParameters) : ''}
                ${result.featureParameters ? this.formatFeatureParameters(result.featureParameters) : ''}
            </div>
        `;

        container.insertAdjacentHTML('beforeend', phaseHtml);
        container.scrollTop = container.scrollHeight;
    }

    displayValidationResult(container, result) {
        const statusClass = result.status === 'passed' ? 'success' :
                          result.status === 'critical_failure' ? 'error' : 'warning';

        const checksHtml = result.validationChecks.map(check => `
            <div class="task-item">
                <div class="task-status">${this.getValidationIcon(check.result)}</div>
                <div class="task-content">
                    <div class="task-name">${check.checkName}</div>
                    <div class="task-description">${check.message}</div>
                </div>
            </div>
        `).join('');

        const violationsHtml = result.violations.map(violation => `
            <div class="violation-item">
                <div class="violation-icon">🚫</div>
                <div class="violation-content">
                    <div class="violation-title">${violation.category}: ${violation.description}</div>
                    ${violation.remediation ? `<div class="violation-remediation">Remediation: ${violation.remediation}</div>` : ''}
                </div>
            </div>
        `).join('');

        const warningsHtml = result.warnings.map(warning => `
            <div class="recommendation-item">
                <div class="recommendation-icon">⚠️</div>
                <div class="recommendation-text">${warning.message}</div>
            </div>
        `).join('');

        const summaryText = `${result.passed} passed, ${result.failed} failed`;

        const phaseHtml = `
            <div class="phase-result ${statusClass}">
                <h3 class="phase-title">${result.phaseName}</h3>
                <div class="phase-summary">${summaryText}</div>

                ${checksHtml ? `<div class="task-list">${checksHtml}</div>` : ''}
                ${violationsHtml ? `<div class="recommendations">${violationsHtml}</div>` : ''}
                ${warningsHtml ? `<div class="recommendations">${warningsHtml}</div>` : ''}
            </div>
        `;

        container.insertAdjacentHTML('beforeend', phaseHtml);
        container.scrollTop = container.scrollHeight;
    }

    displayFinalPlanningReport(container, report) {
        if (!report) return;

        const nextStepsHtml = report.nextSteps.map(step => `
            <div class="recommendation-item">
                <div class="recommendation-icon">📋</div>
                <div class="recommendation-text">${step}</div>
            </div>
        `).join('');

        const reportHtml = `
            <div class="final-report">
                <div class="report-header">
                    <div class="report-status approved">Planning Complete</div>
                    <div class="report-summary">Design parameters established for ${report.projectSummary.address}</div>
                </div>

                <div class="report-section">
                    <h4 class="report-section-title">Project Summary</h4>
                    <div class="task-list">
                        <div class="task-item">
                            <div class="task-content">
                                <div class="task-name">Zone: ${report.projectSummary.zone}</div>
                                <div class="task-description">Lot Size: ${report.projectSummary.lotSize.toLocaleString()} sq ft</div>
                            </div>
                        </div>
                        <div class="task-item">
                            <div class="task-content">
                                <div class="task-name">Compliance Status: ${report.complianceStatus}</div>
                                <div class="task-description">Timeline: ${report.estimatedTimeline}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="report-section">
                    <h4 class="report-section-title">Next Steps</h4>
                    <div class="recommendations">${nextStepsHtml}</div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', reportHtml);
        container.scrollTop = container.scrollHeight;
    }

    displayFinalValidationReport(container, report) {
        if (!report) return;

        const statusClass = report.overallStatus.toLowerCase();
        const statusIcon = {
            'approved': '✅',
            'conditional': '⚠️',
            'rejected': '❌'
        }[statusClass] || '❓';

        const violationSummaryHtml = `
            <div class="task-list">
                <div class="task-item">
                    <div class="task-content">
                        <div class="task-name">Total Violations: ${report.violationSummary.total}</div>
                        <div class="task-description">Critical: ${report.violationSummary.critical}, Major: ${report.violationSummary.major}</div>
                    </div>
                </div>
            </div>
        `;

        const nextStepsHtml = report.nextSteps.map(step => `
            <div class="recommendation-item">
                <div class="recommendation-icon">📋</div>
                <div class="recommendation-text">${step}</div>
            </div>
        `).join('');

        const reportHtml = `
            <div class="final-report">
                <div class="report-header">
                    <div class="report-status ${statusClass}">${statusIcon} ${report.overallStatus}</div>
                    <div class="report-summary">Validation completed for ${report.projectSummary.address}</div>
                </div>

                <div class="report-section">
                    <h4 class="report-section-title">Violation Summary</h4>
                    ${violationSummaryHtml}
                </div>

                <div class="report-section">
                    <h4 class="report-section-title">Resolution Timeline</h4>
                    <div class="task-item">
                        <div class="task-content">
                            <div class="task-name">Estimated Resolution Time</div>
                            <div class="task-description">${report.estimatedResolution}</div>
                        </div>
                    </div>
                </div>

                <div class="report-section">
                    <h4 class="report-section-title">Next Steps</h4>
                    <div class="recommendations">${nextStepsHtml}</div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', reportHtml);
        container.scrollTop = container.scrollHeight;
    }

    displayError(mode, message) {
        const resultsContainer = mode === 'planning'
            ? document.getElementById('planningResults')
            : document.getElementById('validationResults');

        resultsContainer.innerHTML = `
            <div class="phase-result error">
                <h3 class="phase-title">Error</h3>
                <div class="phase-summary">An error occurred during processing</div>
                <div class="violation-item">
                    <div class="violation-icon">❌</div>
                    <div class="violation-content">
                        <div class="violation-description">${message}</div>
                    </div>
                </div>
            </div>
        `;
    }

    formatDesignParameters(params) {
        if (!params) return '';

        return `
            <div class="report-section">
                <h4 class="report-section-title">Design Parameters</h4>
                <div class="task-list">
                    <div class="task-item">
                        <div class="task-content">
                            <div class="task-name">Maximum Height: ${params.maxHeight} feet</div>
                            <div class="task-description">Maximum Floor Area: ${params.maxFloorArea.toLocaleString()} sq ft</div>
                        </div>
                    </div>
                    <div class="task-item">
                        <div class="task-content">
                            <div class="task-name">Setbacks</div>
                            <div class="task-description">Front: ${params.setbacks.front}ft, Side: ${params.setbacks.interiorSide}ft, Rear: ${params.setbacks.rear}ft</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    formatParkingParameters(params) {
        if (!params) return '';

        return `
            <div class="report-section">
                <h4 class="report-section-title">Parking Requirements</h4>
                <div class="task-list">
                    <div class="task-item">
                        <div class="task-content">
                            <div class="task-name">Required Spaces: ${params.required.totalRequired}</div>
                            <div class="task-description">Covered Required: ${params.required.coveredRequired}</div>
                        </div>
                    </div>
                    <div class="task-item">
                        <div class="task-content">
                            <div class="task-name">Driveway: ${params.driveway.minSurfaceWidth}ft surface width</div>
                            <div class="task-description">Garage setback: ${params.garage.frontSetback}ft from front</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    formatFeatureParameters(params) {
        if (!params) return '';

        let html = '<div class="report-section"><h4 class="report-section-title">Special Features</h4><div class="task-list">';

        if (params.secondUnit && params.secondUnit.parameters) {
            html += `
                <div class="task-item">
                    <div class="task-content">
                        <div class="task-name">Second Unit: Feasible</div>
                        <div class="task-description">Max size: ${params.secondUnit.parameters.maxSize} sq ft</div>
                    </div>
                </div>
            `;
        }

        if (params.coverage) {
            html += `
                <div class="task-item">
                    <div class="task-content">
                        <div class="task-name">Lot Coverage: ${params.coverage.maxCoveragePercent}% maximum</div>
                        <div class="task-description">Total allowed: ${params.coverage.totalMaxCoverage.toLocaleString()} sq ft</div>
                    </div>
                </div>
            `;
        }

        html += '</div></div>';
        return html;
    }

    getTaskStatusIcon(status) {
        const icons = {
            'completed': '✅',
            'pass': '✅',
            'fail': '❌',
            'warning': '⚠️',
            'in_progress': '⏳',
            'pending': '⏸️'
        };
        return icons[status] || '❓';
    }

    getValidationIcon(result) {
        const icons = {
            'PASS': '✅',
            'FAIL': '❌',
            'WARNING': '⚠️',
            'INFO': 'ℹ️',
            'N/A': '➖'
        };
        return icons[result] || '❓';
    }

    getRecommendationIcon(type) {
        const icons = {
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'info': 'ℹ️',
            'critical': '🚨'
        };
        return icons[type] || '💡';
    }

    // Template Management
    showTemplateModal(defaultTab = 'load') {
        const modal = document.getElementById('templateModal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);

        this.switchTemplateTab(defaultTab);
        this.loadTemplateList();
    }

    hideTemplateModal() {
        const modal = document.getElementById('templateModal');
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    switchTemplateTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tab);
        });
    }

    loadTemplates() {
        const stored = localStorage.getItem('paloAltoTemplates');
        return stored ? JSON.parse(stored) : [];
    }

    saveTemplates() {
        localStorage.setItem('paloAltoTemplates', JSON.stringify(this.templates));
    }

    loadTemplateList() {
        const templateList = document.getElementById('templateList');

        if (this.templates.length === 0) {
            templateList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <h3 class="empty-title">No Templates</h3>
                    <p class="empty-text">Save your first template to get started.</p>
                </div>
            `;
            return;
        }

        const templatesHtml = this.templates.map((template, index) => `
            <div class="template-item" onclick="app.loadTemplate(${index})">
                <div class="template-name">${template.name}</div>
                <div class="template-description">${template.description}</div>
                <div class="template-meta">
                    ${template.mode} template • Created ${new Date(template.created).toLocaleDateString()}
                </div>
            </div>
        `).join('');

        templateList.innerHTML = templatesHtml;
    }

    saveTemplate() {
        const name = document.getElementById('templateName').value;
        const description = document.getElementById('templateDescription').value;

        if (!name) {
            alert('Please enter a template name');
            return;
        }

        const formId = this.currentMode === 'planning' ? 'planningForm' : 'validationForm';
        const formData = this.getFormData(formId);

        const template = {
            name: name,
            description: description,
            mode: this.currentMode,
            data: formData,
            created: new Date().toISOString()
        };

        this.templates.push(template);
        this.saveTemplates();

        // Clear form
        document.getElementById('templateName').value = '';
        document.getElementById('templateDescription').value = '';

        this.loadTemplateList();
        this.switchTemplateTab('load');

        // Show success message
        alert('Template saved successfully!');
    }

    loadTemplate(index) {
        const template = this.templates[index];

        if (template.mode !== this.currentMode) {
            this.switchMode(template.mode);
        }

        const formId = this.currentMode === 'planning' ? 'planningForm' : 'validationForm';
        this.populateForm(formId, template.data);

        this.hideTemplateModal();
    }

    populateForm(formId, data) {
        const form = document.getElementById(formId);

        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (!field) return;

            if (field.type === 'checkbox') {
                field.checked = data[key];
            } else {
                field.value = data[key];
            }
        });
    }

    // Form field handlers
    updateZoneSpecificFields(zone, form) {
        // This could show zone-specific information or warnings
        console.log(`Zone changed to: ${zone}`);
    }

    validateLotSize(size, form) {
        const zone = form.querySelector('[name="zone"]').value;
        if (!zone) return;

        // Show warnings for substandard lots
        const zoneReq = this.planningEngine.zoneRequirements[zone];
        if (zoneReq && size < zoneReq.minLotSize) {
            // Could show a warning here
        }
    }

    toggleCornerLotFields(isCorner, form) {
        const streetSideField = form.querySelector('[name="streetSideSetback"]');
        if (streetSideField) {
            streetSideField.required = isCorner;
            streetSideField.closest('.form-group').style.display = isCorner ? 'flex' : 'none';
        }
    }

    toggleSecondUnitFields(hasSecondUnit, form) {
        // Could show second unit specific fields
        console.log(`Second unit: ${hasSecondUnit}`);
    }

    // UI Helper Methods
    showReportButton(mode) {
        const buttonId = mode === 'planning' ? 'generatePlanningReport' : 'generateValidationReport';
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = 'block';
        }
    }

    // Report Generation Methods
    generatePlanningReport() {
        if (!this.currentWorkflow || !this.currentWorkflow.results) {
            alert('Please complete the planning workflow first.');
            return;
        }

        const reportData = this.createPlanningReportData();
        this.downloadReport(reportData, 'planning-report', 'Planning Report');
    }

    generateValidationReport() {
        if (!this.currentWorkflow || !this.currentWorkflow.results) {
            alert('Please complete the validation workflow first.');
            return;
        }

        const reportData = this.createValidationReportData();
        this.downloadReport(reportData, 'validation-report', 'Validation Report');
    }

    createPlanningReportData() {
        const workflow = this.currentWorkflow;
        const formData = this.getFormData('planning');

        let reportContent = `# Planning Report\n\n`;
        reportContent += `**Property:** ${formData.address}\n`;
        reportContent += `**APN:** ${formData.apn}\n`;
        reportContent += `**Zone:** ${formData.zone}\n`;
        reportContent += `**Lot Size:** ${formData.lotSize.toLocaleString()} sf\n`;
        reportContent += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;

        reportContent += `## Executive Summary\n\n`;
        reportContent += `Planning analysis completed for ${formData.zone} zoned property. `;
        reportContent += `The following report provides comprehensive planning guidance through all five phases.\n\n`;

        workflow.results.forEach((phase, index) => {
            reportContent += `## Phase ${index + 1}: ${phase.phaseName || phase.phase}\n\n`;

            // Add task details
            if (phase.tasks && phase.tasks.length > 0) {
                reportContent += `### Tasks Completed:\n`;
                phase.tasks.forEach(task => {
                    reportContent += `• **${task.name}:** ${task.status}\n`;
                    if (task.recommendations && task.recommendations.length > 0) {
                        task.recommendations.forEach(rec => {
                            reportContent += `  - ${rec}\n`;
                        });
                    }
                });
                reportContent += `\n`;
            }

            if (phase.recommendations && phase.recommendations.length > 0) {
                reportContent += `### Phase Recommendations:\n`;
                phase.recommendations.forEach(rec => {
                    const icon = this.getRecommendationIcon(rec.type);
                    reportContent += `${icon} **${rec.type.toUpperCase()}:** ${rec.message}\n`;
                    if (rec.action) {
                        reportContent += `  Action: ${rec.action}\n`;
                    }
                });
                reportContent += `\n`;
            }

            if (phase.requirements && phase.requirements.length > 0) {
                reportContent += `### Requirements:\n`;
                phase.requirements.forEach(req => {
                    reportContent += `• ${req}\n`;
                });
                reportContent += `\n`;
            }

            // Phase 2: Design Parameters
            if (phase.designParameters) {
                reportContent += `### Design Parameters:\n`;
                Object.entries(phase.designParameters).forEach(([key, value]) => {
                    let formattedValue = this.formatParameterValue(key, value);
                    reportContent += `• **${this.formatParameterName(key)}:** ${formattedValue}\n`;
                });
                reportContent += `\n`;
            }

            // Phase 3: Parking Parameters
            if (phase.parkingParameters) {
                reportContent += `### Parking & Access Parameters:\n`;
                Object.entries(phase.parkingParameters).forEach(([key, value]) => {
                    let formattedValue = this.formatParameterValue(key, value);
                    reportContent += `• **${this.formatParameterName(key)}:** ${formattedValue}\n`;
                });
                reportContent += `\n`;
            }

            // Phase 4: Feature Parameters
            if (phase.featureParameters) {
                reportContent += `### Special Features & Accessories:\n`;
                Object.entries(phase.featureParameters).forEach(([key, value]) => {
                    if (value && value !== null) {
                        let formattedValue = this.formatParameterValue(key, value);
                        reportContent += `• **${this.formatParameterName(key)}:** ${formattedValue}\n`;
                    }
                });
                reportContent += `\n`;
            }

            // Phase 5: Documentation and Final Report
            if (phase.documentation) {
                reportContent += `### Documentation Requirements:\n`;
                Object.entries(phase.documentation).forEach(([key, value]) => {
                    let formattedValue = this.formatParameterValue(key, value);
                    reportContent += `• **${this.formatParameterName(key)}:** ${formattedValue}\n`;
                });
                reportContent += `\n`;
            }
        });

        reportContent += `## Next Steps\n\n`;
        reportContent += `1. Review all design parameters and requirements\n`;
        reportContent += `2. Consult with architects and engineers as needed\n`;
        reportContent += `3. Prepare preliminary design drawings\n`;
        reportContent += `4. Schedule pre-application meeting with city planning\n`;
        reportContent += `5. Submit formal application when ready\n\n`;

        reportContent += `---\n`;
        reportContent += `*Generated by Palo Alto Planning & Validation Web Application*`;

        return reportContent;
    }

    createValidationReportData() {
        const workflow = this.currentWorkflow;
        const formData = this.getFormData('validation');

        let reportContent = `# Validation Report\n\n`;
        reportContent += `**Property:** ${formData.address}\n`;
        reportContent += `**Zone:** ${formData.zone}\n`;
        reportContent += `**Lot Size:** ${formData.lotSize.toLocaleString()} sf\n`;
        reportContent += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;

        // Overall compliance status
        const overallStatus = this.calculateOverallStatus(workflow.results);
        const statusIcon = overallStatus === 'APPROVED' ? '✅' : overallStatus === 'CONDITIONAL' ? '⚠️' : '❌';
        reportContent += `## Overall Status: ${statusIcon} ${overallStatus}\n\n`;

        let totalViolations = 0;
        let criticalViolations = 0;

        workflow.results.forEach((phase, index) => {
            reportContent += `## Phase ${index + 1}: ${phase.phase}\n\n`;

            if (phase.validationResults && phase.validationResults.length > 0) {
                phase.validationResults.forEach(result => {
                    const icon = this.getValidationIcon(result.status);
                    const severity = result.critical ? ' (CRITICAL)' : '';

                    if (result.status === 'FAIL') {
                        totalViolations++;
                        if (result.critical) criticalViolations++;
                    }

                    reportContent += `${icon} **${result.rule}**${severity}\n`;
                    reportContent += `   Status: ${result.status}\n`;
                    reportContent += `   Message: ${result.message}\n`;

                    if (result.actual !== undefined) {
                        reportContent += `   Actual: ${this.formatValidationValue(result.actual)}\n`;
                    }
                    if (result.required !== undefined) {
                        reportContent += `   Required: ${this.formatValidationValue(result.required)}\n`;
                    }

                    if (result.status === 'FAIL' && result.remediation) {
                        reportContent += `   **Remediation:** ${result.remediation}\n`;
                    }

                    reportContent += `\n`;
                });
            }
        });

        reportContent += `## Summary\n\n`;
        reportContent += `• **Total Violations:** ${totalViolations}\n`;
        reportContent += `• **Critical Violations:** ${criticalViolations}\n`;
        reportContent += `• **Status:** ${overallStatus}\n\n`;

        if (totalViolations > 0) {
            reportContent += `## Required Actions\n\n`;
            if (criticalViolations > 0) {
                reportContent += `🚨 **CRITICAL:** Address ${criticalViolations} critical violation(s) before proceeding.\n`;
            }
            reportContent += `• Review and address all validation failures listed above\n`;
            reportContent += `• Revise design to meet zoning requirements\n`;
            reportContent += `• Re-validate design after modifications\n\n`;
        } else {
            reportContent += `## Approval Status\n\n`;
            reportContent += `✅ All validations passed. Design meets zoning requirements.\n\n`;
        }

        reportContent += `---\n`;
        reportContent += `*Generated by Palo Alto Planning & Validation Web Application*`;

        return reportContent;
    }

    calculateOverallStatus(results) {
        let hasCriticalFailures = false;
        let hasFailures = false;

        results.forEach(phase => {
            if (phase.validationResults) {
                phase.validationResults.forEach(result => {
                    if (result.status === 'FAIL') {
                        hasFailures = true;
                        if (result.critical) {
                            hasCriticalFailures = true;
                        }
                    }
                });
            }
        });

        if (hasCriticalFailures) return 'REJECTED';
        if (hasFailures) return 'CONDITIONAL';
        return 'APPROVED';
    }

    downloadReport(content, filename, title) {
        // Create HTML version of the report
        const htmlContent = this.convertMarkdownToHtml(content, title);

        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    convertMarkdownToHtml(markdown, title) {
        // Basic markdown to HTML conversion
        let html = markdown
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/^• (.+)$/gm, '<li>$1</li>')
            .replace(/^---$/gm, '<hr>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        // Wrap list items
        html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
        html = html.replace(/<\/ul><br><ul>/g, '');

        // Wrap paragraphs
        html = '<p>' + html + '</p>';
        html = html.replace(/<p><h/g, '<h').replace(/<\/h([1-6])><\/p>/g, '</h$1>');
        html = html.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
        html = html.replace(/<p><hr><\/p>/g, '<hr>');

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
        h1 { color: #007AFF; border-bottom: 2px solid #007AFF; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; }
        h3 { color: #666; }
        ul { margin: 10px 0; }
        li { margin: 5px 0; }
        hr { margin: 30px 0; border: none; border-top: 1px solid #ddd; }
        .status-approved { color: #34C759; font-weight: bold; }
        .status-conditional { color: #FF9500; font-weight: bold; }
        .status-rejected { color: #FF3B30; font-weight: bold; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
    }

    // Report formatting helper methods
    formatParameterName(key) {
        const nameMap = {
            'maxHeight': 'Maximum Building Height',
            'maxFloorArea': 'Maximum Floor Area',
            'setbacks': 'Required Setbacks',
            'farBreakdown': 'Floor Area Ratio Breakdown',
            'buildingEnvelope': 'Building Envelope',
            'parkingRequirements': 'Parking Requirements',
            'accessRequirements': 'Access Requirements',
            'secondUnitEligible': 'Second Unit Eligibility',
            'poolAllowed': 'Pool Allowed',
            'maxLotCoverage': 'Maximum Lot Coverage',
            // Phase 3 - Parking
            'required': 'Required Parking',
            'driveway': 'Driveway Requirements',
            'garage': 'Garage Requirements',
            'access': 'Access Requirements',
            // Phase 4 - Features
            'secondUnit': 'Second Unit Assessment',
            'accessoryStructures': 'Accessory Structures',
            'poolSpa': 'Pool & Spa Requirements',
            'coverage': 'Lot Coverage Analysis',
            // Phase 5 - Documentation
            'drawingRequirements': 'Drawing Requirements',
            'professionalStamps': 'Professional Stamps Required',
            'submissionProcess': 'Submission Process',
            'reviewTimeline': 'Review Timeline'
        };
        return nameMap[key] || this.camelCaseToTitle(key);
    }

    camelCaseToTitle(str) {
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    formatParameterValue(key, value) {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        if (typeof value === 'object') {
            if (key === 'setbacks') {
                return this.formatSetbacks(value);
            } else if (key === 'farBreakdown') {
                return this.formatFarBreakdown(value);
            } else if (key === 'buildingEnvelope') {
                return this.formatBuildingEnvelope(value);
            } else if (key === 'parkingRequirements' || key === 'required') {
                return this.formatParkingRequirements(value);
            } else if (key === 'driveway') {
                return this.formatDrivewayRequirements(value);
            } else if (key === 'garage') {
                return this.formatGarageRequirements(value);
            } else if (key === 'access') {
                return this.formatAccessRequirements(value);
            } else if (key === 'secondUnit') {
                return this.formatSecondUnitAssessment(value);
            } else if (key === 'accessoryStructures') {
                return this.formatAccessoryStructures(value);
            } else if (key === 'poolSpa') {
                return this.formatPoolSpaRequirements(value);
            } else if (key === 'coverage') {
                return this.formatCoverageRequirements(value);
            } else {
                // Generic object formatting
                return Object.entries(value)
                    .filter(([k, v]) => v !== null && v !== undefined)
                    .map(([k, v]) => `${this.camelCaseToTitle(k)}: ${this.formatSimpleValue(v)}`)
                    .join(', ');
            }
        }

        if (typeof value === 'number') {
            if (key.includes('Height') || key.includes('height')) {
                return `${value} feet`;
            } else if (key.includes('Area') || key.includes('area') || key.includes('Size') || key.includes('size')) {
                return `${value.toLocaleString()} sq ft`;
            } else if (key.includes('Coverage') || key.includes('coverage')) {
                return `${value.toLocaleString()} sq ft`;
            } else {
                return value.toLocaleString();
            }
        }

        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }

        return value.toString();
    }

    formatSetbacks(setbacks) {
        if (!setbacks || typeof setbacks !== 'object') return 'N/A';

        const parts = [];
        if (setbacks.front) parts.push(`Front: ${setbacks.front} ft`);
        if (setbacks.interiorSide) parts.push(`Interior Side: ${setbacks.interiorSide} ft`);
        if (setbacks.streetSide) parts.push(`Street Side: ${setbacks.streetSide} ft`);
        if (setbacks.rear) parts.push(`Rear: ${setbacks.rear} ft`);

        if (setbacks.specialConditions && setbacks.specialConditions.length > 0) {
            parts.push(`Special: ${setbacks.specialConditions.join(', ')}`);
        }

        return parts.length > 0 ? parts.join(' | ') : 'Standard setbacks apply';
    }

    formatFarBreakdown(farData) {
        if (!farData || typeof farData !== 'object') return 'N/A';

        const parts = [];
        if (farData.maxFloorArea) parts.push(`Maximum Floor Area: ${farData.maxFloorArea.toLocaleString()} sq ft`);
        if (farData.first5000Allowance) parts.push(`First 5000 sf @ 45%: ${Math.round(farData.first5000Allowance).toLocaleString()} sq ft`);
        if (farData.excessAllowance) parts.push(`Excess @ 30%: ${Math.round(farData.excessAllowance).toLocaleString()} sq ft`);
        if (farData.calculatedFAR) parts.push(`Total Calculated: ${Math.round(farData.calculatedFAR).toLocaleString()} sq ft`);

        return parts.length > 0 ? parts.join(' | ') : 'Standard FAR applies';
    }

    formatBuildingEnvelope(envelope) {
        if (!envelope || typeof envelope !== 'object') return 'N/A';

        const parts = [];

        if (envelope.daylightPlane) {
            const dp = envelope.daylightPlane;
            parts.push(`Daylight Plane: ${dp.angle}° from ${dp.measurementHeight} ft height`);
        }

        if (envelope.architecturalFeatures) {
            const features = [];
            const af = envelope.architecturalFeatures;
            if (af.porches) features.push(`Porches: ${af.porches.maxSize} ${af.porches.unit}`);
            if (af.entryProjections) features.push(`Entry projections: ${af.entryProjections.maxProjection} ${af.entryProjections.unit}`);
            if (af.bayWindows) features.push(`Bay windows: ${af.bayWindows.maxProjection} ft projection, ${af.bayWindows.maxWidth} ft width max`);
            if (features.length > 0) {
                parts.push(`Architectural Features: ${features.join(', ')}`);
            }
        }

        return parts.length > 0 ? parts.join(' | ') : 'Standard building envelope applies';
    }

    formatParkingRequirements(parking) {
        if (!parking || typeof parking !== 'object') return 'N/A';

        const parts = [];
        if (parking.required) parts.push(`Required: ${parking.required} spaces`);
        if (parking.covered) parts.push(`Covered: ${parking.covered} spaces`);
        if (parking.uncovered) parts.push(`Uncovered: ${parking.uncovered} spaces`);

        return parts.length > 0 ? parts.join(', ') : 'Standard parking applies';
    }

    formatValidationValue(value) {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return value.toString();
    }

    formatSimpleValue(value) {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'number') return value.toLocaleString();
        return value.toString();
    }

    // Phase 3 formatting methods
    formatDrivewayRequirements(driveway) {
        if (!driveway) return 'Standard driveway requirements';
        const parts = [];
        if (driveway.surfaceWidth) parts.push(`Surface Width: ${driveway.surfaceWidth} ft`);
        if (driveway.clearanceWidth) parts.push(`Clearance Width: ${driveway.clearanceWidth} ft`);
        if (driveway.backingDistance) parts.push(`Backing Distance: ${driveway.backingDistance} ft`);
        return parts.length > 0 ? parts.join(' | ') : 'Standard driveway requirements';
    }

    formatGarageRequirements(garage) {
        if (!garage) return 'Standard garage requirements';
        const parts = [];
        if (garage.setbackFromStreet) parts.push(`Street Setback: ${garage.setbackFromStreet} ft`);
        if (garage.minDimensions) parts.push(`Min Dimensions: ${garage.minDimensions}`);
        if (garage.doorOrientation) parts.push(`Door Orientation: ${garage.doorOrientation}`);
        return parts.length > 0 ? parts.join(' | ') : 'Standard garage requirements';
    }

    formatAccessRequirements(access) {
        if (!access) return 'Standard access requirements';
        const parts = [];
        if (access.backingDistance) parts.push(`Backing Distance: ${access.backingDistance} ft`);
        if (access.turnRadius) parts.push(`Turn Radius: ${access.turnRadius} ft`);
        if (access.clearanceRequirements) parts.push(`Clearance: ${access.clearanceRequirements}`);
        return parts.length > 0 ? parts.join(' | ') : 'Standard access requirements';
    }

    // Phase 4 formatting methods
    formatSecondUnitAssessment(assessment) {
        if (!assessment) return 'Second unit not assessed';
        const parts = [];
        if (assessment.eligible !== undefined) parts.push(`Eligible: ${assessment.eligible ? 'Yes' : 'No'}`);
        if (assessment.maxSize) parts.push(`Max Size: ${assessment.maxSize.toLocaleString()} sq ft`);
        if (assessment.parkingRequired) parts.push(`Additional Parking: ${assessment.parkingRequired ? 'Required' : 'Not required'}`);
        if (assessment.restrictions && assessment.restrictions.length > 0) {
            parts.push(`Restrictions: ${assessment.restrictions.join(', ')}`);
        }
        return parts.length > 0 ? parts.join(' | ') : 'Assessment pending';
    }

    formatAccessoryStructures(structures) {
        if (!structures) return 'Standard accessory structure rules';
        const parts = [];
        if (structures.maxHeight) parts.push(`Max Height: ${structures.maxHeight} ft`);
        if (structures.setbacks) parts.push(`Setbacks: ${structures.setbacks} ft`);
        if (structures.maxSize) parts.push(`Max Size: ${structures.maxSize.toLocaleString()} sq ft`);
        if (structures.allowedTypes) parts.push(`Allowed Types: ${structures.allowedTypes.join(', ')}`);
        return parts.length > 0 ? parts.join(' | ') : 'Standard accessory structure rules';
    }

    formatPoolSpaRequirements(pool) {
        if (!pool) return 'Standard pool/spa requirements';
        const parts = [];
        if (pool.setbacks) parts.push(`Setbacks: ${pool.setbacks} ft`);
        if (pool.safetyRequirements) parts.push(`Safety: ${pool.safetyRequirements.join(', ')}`);
        if (pool.coverageLimit) parts.push(`Coverage Limit: ${pool.coverageLimit}%`);
        return parts.length > 0 ? parts.join(' | ') : 'Standard pool/spa requirements';
    }

    formatCoverageRequirements(coverage) {
        if (!coverage) return 'Standard coverage requirements';
        const parts = [];
        if (coverage.maxCoverage) parts.push(`Max Coverage: ${coverage.maxCoverage}%`);
        if (coverage.currentCoverage) parts.push(`Current: ${coverage.currentCoverage}%`);
        if (coverage.landscapeRequired) parts.push(`Landscape Required: ${coverage.landscapeRequired}%`);
        return parts.length > 0 ? parts.join(' | ') : 'Standard coverage requirements';
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    window.app = new PlanningValidationApp();

    // Force initial mode display after short delay
    setTimeout(() => {
        console.log('Forcing initial mode display...');
        if (window.app) {
            window.app.switchMode('planning'); // Force planning mode initially
        }
    }, 100);
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlanningValidationApp;
}