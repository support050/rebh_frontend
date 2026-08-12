'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadExcelReportAction } from './actions';

export default function DashboardUploadPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [companySymbol, setCompanySymbol] = useState('');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (file: File) => {
        const validExtensions = ['.xlsx', '.xls', '.xlsm'];
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(extension)) {
            setUploadResult({
                success: false,
                message: 'Invalid file type. Only Excel files (.xlsx, .xls, .xlsm) are allowed.'
            });
            return;
        }

        setSelectedFile(file);
        setUploadResult(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !companySymbol.trim()) {
            setUploadResult({
                success: false,
                message: 'Please select a file and enter a company symbol.'
            });
            return;
        }

        setUploading(true);
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('company_symbol', companySymbol.trim().toUpperCase());
            if (description.trim()) {
                formData.append('description', description.trim());
            }

            const result = await uploadExcelReportAction(formData);
            if (!result.success) {
                throw new Error(result.error || 'Upload failed');
            }

            setUploadResult({
                success: true,
                message: `Successfully uploaded ${result.data?.file_name || selectedFile.name}`
            });

            // Reset form
            setSelectedFile(null);
            setCompanySymbol('');
            setDescription('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (err: any) {
            setUploadResult({
                success: false,
                message: err.message || 'Upload failed'
            });
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Upload className="w-7 h-7 text-purple-600" />
                        Upload Excel Report
                    </h1>
                    <p className="text-gray-500 mt-1">رفع ملف Excel للأرشفة</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">

                    {/* File Drop Zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                            ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'}
                            ${selectedFile ? 'border-green-500 bg-green-50' : ''}
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.xlsm"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {selectedFile ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
                                >
                                    <X className="w-4 h-4" />
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Drop your Excel file here</p>
                                    <p className="text-sm text-gray-500">or click to browse</p>
                                </div>
                                <p className="text-xs text-gray-400">Supported: .xlsx, .xls, .xlsm</p>
                            </div>
                        )}
                    </div>

                    {/* Company Symbol */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Symbol <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={companySymbol}
                            onChange={(e) => setCompanySymbol(e.target.value)}
                            placeholder="e.g., 4020, 2222"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a note about this file..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Upload Result */}
                    {uploadResult && (
                        <div className={`flex items-center gap-3 p-4 rounded-lg ${uploadResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {uploadResult.success ? (
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            )}
                            <p>{uploadResult.message}</p>
                        </div>
                    )}

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || !companySymbol.trim() || uploading}
                        className={`
                            w-full py-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all
                            ${(!selectedFile || !companySymbol.trim() || uploading)
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
                            }
                        `}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Upload File
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
