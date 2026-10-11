// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AuditTrail {
    struct AuditEntry {
        string documentId;
        string action;
        string userId;
        uint256 timestamp;
    }

    AuditEntry[] public auditEntries;

    event AuditRecorded(
        string documentId,
        string action,
        string userId,
        uint256 timestamp
    );

    function recordAudit(
        string memory documentId,
        string memory action,
        string memory userId
    ) public {
        auditEntries.push(
            AuditEntry(
                documentId,
                action,
                userId,
                block.timestamp
            )
        );

        emit AuditRecorded(
            documentId,
            action,
            userId,
            block.timestamp
        );
    }

    function getAuditCount() public view returns (uint256) {
        return auditEntries.length;
    }

    function getAudit(uint256 index)
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256
        )
    {
        AuditEntry memory entry = auditEntries[index];

        return (
            entry.documentId,
            entry.action,
            entry.userId,
            entry.timestamp
        );
    }
}