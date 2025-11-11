package com.kyc.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class KYCEvent {
    @JsonProperty("customerId")
    private String customerId;
    
    @JsonProperty("eventType")
    private String eventType;
    
    @JsonProperty("kycStatus")
    private KYCStatus kycStatus;
    
    @JsonProperty("documentUrl")
    private String documentUrl;
    
    @JsonProperty("verificationScore")
    private Double verificationScore;
    
    @JsonProperty("fraudScore")
    private Double fraudScore;
    
    @JsonProperty("metadata")
    private String metadata;
    
    @JsonProperty("lastUpdated")
    private String lastUpdated;
    
    @JsonProperty("isValid")
    private Boolean isValid;
    
    @JsonProperty("isVerified")
    private Boolean isVerified;
    
    @JsonProperty("fraudDetected")
    private Boolean fraudDetected;
    
    public enum KYCStatus {
        PENDING,
        VALIDATED,
        VERIFIED,
        FRAUD_DETECTED,
        COMPLETED,
        FAILED
    }
    
    // Constructors
    public KYCEvent() {}
    
    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private KYCEvent event = new KYCEvent();
        
        public Builder customerId(String customerId) {
            event.customerId = customerId;
            return this;
        }
        
        public Builder eventType(String eventType) {
            event.eventType = eventType;
            return this;
        }
        
        public Builder kycStatus(KYCStatus kycStatus) {
            event.kycStatus = kycStatus;
            return this;
        }
        
        public Builder documentUrl(String documentUrl) {
            event.documentUrl = documentUrl;
            return this;
        }
        
        public Builder verificationScore(Double verificationScore) {
            event.verificationScore = verificationScore;
            return this;
        }
        
        public Builder fraudScore(Double fraudScore) {
            event.fraudScore = fraudScore;
            return this;
        }
        
        public Builder metadata(String metadata) {
            event.metadata = metadata;
            return this;
        }
        
        public Builder lastUpdated(String lastUpdated) {
            event.lastUpdated = lastUpdated;
            return this;
        }
        
        public Builder isValid(Boolean isValid) {
            event.isValid = isValid;
            return this;
        }
        
        public Builder isVerified(Boolean isVerified) {
            event.isVerified = isVerified;
            return this;
        }
        
        public Builder fraudDetected(Boolean fraudDetected) {
            event.fraudDetected = fraudDetected;
            return this;
        }
        
        public KYCEvent build() {
            return event;
        }
    }
    
    // Getters and Setters
    public String getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }
    
    public String getEventType() {
        return eventType;
    }
    
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
    
    public KYCStatus getKycStatus() {
        return kycStatus;
    }
    
    public void setKycStatus(KYCStatus kycStatus) {
        this.kycStatus = kycStatus;
    }
    
    public String getDocumentUrl() {
        return documentUrl;
    }
    
    public void setDocumentUrl(String documentUrl) {
        this.documentUrl = documentUrl;
    }
    
    public Double getVerificationScore() {
        return verificationScore;
    }
    
    public void setVerificationScore(Double verificationScore) {
        this.verificationScore = verificationScore;
    }
    
    public Double getFraudScore() {
        return fraudScore;
    }
    
    public void setFraudScore(Double fraudScore) {
        this.fraudScore = fraudScore;
    }
    
    public String getMetadata() {
        return metadata;
    }
    
    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
    
    public String getLastUpdated() {
        return lastUpdated;
    }
    
    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
    
    public Boolean getIsValid() {
        return isValid;
    }
    
    public void setIsValid(Boolean isValid) {
        this.isValid = isValid;
    }
    
    public Boolean getIsVerified() {
        return isVerified;
    }
    
    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }
    
    public Boolean getFraudDetected() {
        return fraudDetected;
    }
    
    public void setFraudDetected(Boolean fraudDetected) {
        this.fraudDetected = fraudDetected;
    }
}
