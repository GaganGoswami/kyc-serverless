package com.kyc.agents;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.kyc.model.KYCEvent;
import com.kyc.model.KYCEvent.KYCStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequestEntry;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * ComplianceReportingAgent
 * 
 * Generates compliance reports by:
 * - Aggregating all KYC verification results
 * - Creating audit trail documentation
 * - Generating compliance summary reports
 * - Storing reports in S3
 * - Updating final KYC status
 * 
 * Publishes KYC.Completed event to EventBridge.
 */
public class ComplianceReportingAgent implements RequestHandler<Map<String, Object>, KYCEvent> {
    private static final Logger logger = LoggerFactory.getLogger(ComplianceReportingAgent.class);
    private static final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    
    private final DynamoDbClient dynamoDbClient;
    private final EventBridgeClient eventBridgeClient;
    private final S3Client s3Client;
    private final String tableName;
    private final String eventBusName;
    private final String documentBucket;
    
    public ComplianceReportingAgent() {
        this.dynamoDbClient = DynamoDbClient.create();
        this.eventBridgeClient = EventBridgeClient.create();
        this.s3Client = S3Client.create();
        this.tableName = System.getenv("TABLE_NAME");
        this.eventBusName = System.getenv("EVENT_BUS_NAME");
        this.documentBucket = System.getenv("DOCUMENT_BUCKET");
    }
    
    @Override
    public KYCEvent handleRequest(Map<String, Object> input, Context context) {
        logger.info("ComplianceReportingAgent invoked: {}", input);
        
        try {
            // Extract fraud result from previous step
            Map<String, Object> fraudResult = extractFraudResult(input);
            String customerId = (String) fraudResult.get("customerId");
            String documentUrl = (String) fraudResult.get("documentUrl");
            Boolean fraudDetected = (Boolean) fraudResult.get("fraudDetected");
            
            logger.info("Processing compliance reporting for customer: {}", customerId);
            
            // Generate compliance report
            String reportContent = generateComplianceReport(input, customerId);
            String reportUrl = storeComplianceReport(customerId, reportContent);
            
            // Determine final KYC status
            KYCStatus finalStatus = fraudDetected ? KYCStatus.FRAUD_DETECTED : KYCStatus.COMPLETED;
            
            // Create KYC event
            KYCEvent event = KYCEvent.builder()
                .customerId(customerId)
                .eventType("Compliance.Completed")
                .kycStatus(finalStatus)
                .documentUrl(reportUrl)
                .lastUpdated(Instant.now().toString())
                .metadata(String.format("KYC process completed - Final status: %s", finalStatus))
                .build();
            
            // Store final status in DynamoDB
            storeToDynamoDB(event);
            
            // Publish completion event to EventBridge
            publishEvent(event);
            
            logger.info("Compliance reporting completed for customer: {} - Status: {}", customerId, finalStatus);
            return event;
            
        } catch (Exception e) {
            logger.error("Error in ComplianceReportingAgent", e);
            throw new RuntimeException("Compliance reporting failed", e);
        }
    }
    
    private Map<String, Object> extractFraudResult(Map<String, Object> input) {
        // Extract from Step Functions input
        if (input.containsKey("fraudResult")) {
            Map<String, Object> fraudResult = (Map<String, Object>) input.get("fraudResult");
            return (Map<String, Object>) fraudResult.get("Payload");
        }
        return input;
    }
    
    private String generateComplianceReport(Map<String, Object> workflowData, String customerId) {
        // Generate comprehensive compliance report
        StringBuilder report = new StringBuilder();
        report.append("KYC COMPLIANCE REPORT\n");
        report.append("=".repeat(50)).append("\n\n");
        report.append("Customer ID: ").append(customerId).append("\n");
        report.append("Report Date: ").append(Instant.now()).append("\n\n");
        
        // Document Validation Summary
        report.append("1. DOCUMENT VALIDATION\n");
        report.append("-".repeat(50)).append("\n");
        if (workflowData.containsKey("validationResult")) {
            Map<String, Object> validation = (Map<String, Object>) workflowData.get("validationResult");
            Map<String, Object> payload = (Map<String, Object>) validation.get("Payload");
            report.append("Status: ").append(payload.get("isValid")).append("\n");
            report.append("Score: ").append(payload.get("verificationScore")).append("\n\n");
        }
        
        // Identity Verification Summary
        report.append("2. IDENTITY VERIFICATION\n");
        report.append("-".repeat(50)).append("\n");
        if (workflowData.containsKey("verificationResult")) {
            Map<String, Object> verification = (Map<String, Object>) workflowData.get("verificationResult");
            Map<String, Object> payload = (Map<String, Object>) verification.get("Payload");
            report.append("Status: ").append(payload.get("isVerified")).append("\n");
            report.append("Score: ").append(payload.get("verificationScore")).append("\n\n");
        }
        
        // Fraud Detection Summary
        report.append("3. FRAUD DETECTION\n");
        report.append("-".repeat(50)).append("\n");
        if (workflowData.containsKey("fraudResult")) {
            Map<String, Object> fraud = (Map<String, Object>) workflowData.get("fraudResult");
            Map<String, Object> payload = (Map<String, Object>) fraud.get("Payload");
            report.append("Fraud Detected: ").append(payload.get("fraudDetected")).append("\n");
            report.append("Risk Score: ").append(payload.get("fraudScore")).append("\n\n");
        }
        
        // Final Recommendation
        report.append("4. FINAL RECOMMENDATION\n");
        report.append("-".repeat(50)).append("\n");
        report.append("KYC Process: COMPLETED\n");
        report.append("Compliance Status: APPROVED\n\n");
        
        report.append("=".repeat(50)).append("\n");
        report.append("End of Report\n");
        
        return report.toString();
    }
    
    private String storeComplianceReport(String customerId, String reportContent) {
        try {
            String reportKey = String.format("reports/%s/compliance-report-%s.txt", 
                customerId, Instant.now().toEpochMilli());
            
            PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(documentBucket)
                .key(reportKey)
                .contentType("text/plain")
                .build();
            
            s3Client.putObject(putRequest, RequestBody.fromString(reportContent));
            
            String reportUrl = String.format("s3://%s/%s", documentBucket, reportKey);
            logger.info("Stored compliance report: {}", reportUrl);
            
            return reportUrl;
            
        } catch (Exception e) {
            logger.error("Failed to store compliance report", e);
            return "report-storage-failed";
        }
    }
    
    private void storeToDynamoDB(KYCEvent event) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("customerId", AttributeValue.builder().s(event.getCustomerId()).build());
        item.put("eventType", AttributeValue.builder().s(event.getEventType()).build());
        item.put("kycStatus", AttributeValue.builder().s(event.getKycStatus().name()).build());
        item.put("documentUrl", AttributeValue.builder().s(event.getDocumentUrl()).build());
        item.put("lastUpdated", AttributeValue.builder().s(event.getLastUpdated()).build());
        item.put("metadata", AttributeValue.builder().s(event.getMetadata()).build());
        
        PutItemRequest request = PutItemRequest.builder()
            .tableName(tableName)
            .item(item)
            .build();
        
        dynamoDbClient.putItem(request);
        logger.info("Stored event to DynamoDB: {}", event.getEventType());
    }
    
    private void publishEvent(KYCEvent event) {
        try {
            String eventDetail = objectMapper.writeValueAsString(event);
            
            PutEventsRequestEntry eventEntry = PutEventsRequestEntry.builder()
                .eventBusName(eventBusName)
                .source("kyc.compliance")
                .detailType("KYC.Completed")
                .detail(eventDetail)
                .build();
            
            PutEventsRequest request = PutEventsRequest.builder()
                .entries(eventEntry)
                .build();
            
            eventBridgeClient.putEvents(request);
            logger.info("Published KYC.Completed event to EventBridge");
            
        } catch (Exception e) {
            logger.error("Failed to publish event", e);
        }
    }
}
