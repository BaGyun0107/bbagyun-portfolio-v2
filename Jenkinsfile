pipeline {
    agent any

    environment {
        NODE_VERSION = '24.13.1'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'corepack enable'
                sh 'corepack prepare pnpm@latest --activate'
                sh 'pnpm install'
            }
        }
        stage('Prisma Generate') {
            steps {
                sh 'npx prisma generate'
            }
        }
        stage('Lint') {
            steps {
                sh 'pnpm run lint'
            }
        }
        stage('Build') {
            steps {
                sh 'pnpm run build'
            }
        }
        stage('Deploy') {
            steps {
                sh 'pm2 startOrReload ecosystem.config.js --env production'
            }
        }
    }
}
