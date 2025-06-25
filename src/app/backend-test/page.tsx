
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const BackendTestPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [graphId, setGraphId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [subgraphResult, setSubgraphResult] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      console.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3001/parser/mindmap/upload-and-store', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setUploadResult(data);
      if (data.graphId) {
        setGraphId(data.graphId);
      }
      console.log('File uploaded and processed.', data);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleSearch = async () => {
    if (!keyword) {
      console.error('Please enter a keyword');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/parser/graphs/search?keyword=${keyword}`);
      const data = await response.json();
      setSearchResult(data);
      console.log('Search completed.', data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleGetSubgraph = async () => {
    if (!graphId || !nodeId) {
      console.error('Please enter Graph ID and Node ID');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/parser/graphs/${graphId}/nodes/${nodeId}/subgraph`);
      const data = await response.json();
      setSubgraphResult(data);
      console.log('Subgraph fetched.', data);
    } catch (error) {
      console.error('Subgraph error:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Backend API Test Page</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>1. Upload MindMap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input type="file" onChange={handleFileChange} />
            <Button onClick={handleUpload}>Upload</Button>
          </div>
          {uploadResult && (
            <pre className="mt-2 p-2 bg-gray-100 rounded">
              {JSON.stringify(uploadResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>2. Search Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          {searchResult && (
            <pre className="mt-2 p-2 bg-gray-100 rounded">
              {JSON.stringify(searchResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Get Subgraph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Graph ID"
              value={graphId}
              onChange={(e) => setGraphId(e.target.value)}
            />
            <Input
              placeholder="Node ID"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
            />
            <Button onClick={handleGetSubgraph}>Get Subgraph</Button>
          </div>
          {subgraphResult && (
            <pre className="mt-2 p-2 bg-gray-100 rounded">
              {JSON.stringify(subgraphResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackendTestPage;
