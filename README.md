# CloudNest — Cloud-Based File Storage System

## 1. Project Overview

CloudNest is a React-based file management application developed as a college project. The current prototype allows users to upload, search, download, and delete files using browser-based persistent storage.

The project is intended to demonstrate the core workflow of a cloud file storage system, with AWS integration planned as a future development stage.

## 2. Objectives

- Develop a user-friendly file management dashboard.
- Support file upload, search, download, and deletion.
- Persist uploaded files using IndexedDB.
- Demonstrate time-limited sharing records.
- Plan a secure and scalable AWS-based architecture.

## 3. Technologies Used

- **Frontend:** React, JavaScript, Vite
- **UI icons:** Lucide React
- **Local persistence:** IndexedDB using the `idb` library
- **Planned cloud services:** Amazon S3, AWS Lambda, API Gateway, DynamoDB, Amazon Cognito, IAM, CloudWatch
- **Planned infrastructure and automation:** Terraform and GitHub Actions

## 4. Implemented Features

- File upload and listing
- File search
- File download
- File deletion
- Persistent browser storage
- Local demo sharing records with expiry times
- Storage usage and file count display

## 5. Setup Instructions

Requirements: Node.js and npm.

1. Clone or download the project.
2. Open the project directory in a terminal.
3. Install dependencies:

   `npm install`

4. Start the development server:

   `npm run dev`

5. Open the local URL printed in the terminal, usually `http://localhost:5173/`.

## 6. Current Limitations

This prototype uses browser-based storage and is not yet connected to AWS. Files are not uploaded to an S3 bucket. Demo sharing records do not generate public links or enforce access restrictions. Authentication, backend APIs, cloud monitoring, and automated cloud deployment remain planned features.

## 7. Planned Enhancements

- Integrate Amazon S3 for cloud file storage.
- Implement backend APIs using AWS Lambda and API Gateway.
- Store file metadata in DynamoDB.
- Add user authentication and authorization using Amazon Cognito and IAM.
- Implement secure, expiring S3 pre-signed URLs.
- Add infrastructure provisioning with Terraform.
- Configure GitHub Actions for automated testing and deployment.
- Configure CloudWatch monitoring and AWS Budgets.

## 8. Conclusion

CloudNest provides a working local prototype of a file management interface. It establishes the frontend and local persistence foundation for a future secure, cloud-based file storage system.
