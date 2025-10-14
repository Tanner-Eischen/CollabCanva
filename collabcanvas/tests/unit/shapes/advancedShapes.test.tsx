// Unit tests for Advanced Shapes (PR-16)

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Stage, Layer } from 'react-konva'
import Line from '../../../src/components/shapes/Line'
import Polygon from '../../../src/components/shapes/Polygon'
import Star from '../../../src/components/shapes/Star'
import RoundedRect from '../../../src/components/shapes/RoundedRect'

describe('Advanced Shapes Unit Tests (PR-16)', () => {
  const mockOnClick = vi.fn()
  const mockOnDragStart = vi.fn()
  const mockOnDragEnd = vi.fn()
  const mockOnTransformEnd = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Line Component', () => {
    it('should render line with basic properties', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Line
              id="line1"
              points={[0, 0, 100, 100]}
              x={0}
              y={0}
              stroke="#FF0000FF"
              strokeWidth={2}
              fill="#FF0000FF"
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should render line with arrows', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Line
              id="line2"
              points={[0, 0, 100, 100]}
              x={0}
              y={0}
              stroke="#FF0000FF"
              strokeWidth={2}
              fill="#FF0000FF"
              selected={false}
              arrows={{ start: true, end: true }}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should render line with only start arrow', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Line
              id="line3"
              points={[0, 0, 100, 100]}
              x={0}
              y={0}
              stroke="#FF0000FF"
              strokeWidth={2}
              fill="#FF0000FF"
              selected={false}
              arrows={{ start: true, end: false }}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should render line with only end arrow', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Line
              id="line4"
              points={[0, 0, 100, 100]}
              x={0}
              y={0}
              stroke="#FF0000FF"
              strokeWidth={2}
              fill="#FF0000FF"
              selected={false}
              arrows={{ start: false, end: true }}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should handle complex line paths', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Line
              id="line5"
              points={[0, 0, 50, 50, 100, 0, 150, 50]}
              x={0}
              y={0}
              stroke="#FF0000FF"
              strokeWidth={2}
              fill="#FF0000FF"
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })
  })

  describe('Polygon Component', () => {
    it('should render triangle (3 sides)', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Polygon
              id="poly1"
              x={100}
              y={100}
              width={100}
              height={100}
              sides={3}
              fill="#00FF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should render pentagon (5 sides)', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Polygon
              id="poly2"
              x={100}
              y={100}
              width={100}
              height={100}
              sides={5}
              fill="#00FF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should render hexagon (6 sides)', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Polygon
              id="poly3"
              x={100}
              y={100}
              width={100}
              height={100}
              sides={6}
              fill="#00FF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should render octagon (8 sides)', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Polygon
              id="poly4"
              x={100}
              y={100}
              width={100}
              height={100}
              sides={8}
              fill="#00FF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should handle rotation', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Polygon
              id="poly5"
              x={100}
              y={100}
              width={100}
              height={100}
              sides={6}
              rotation={45}
              fill="#00FF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })
  })

  describe('Star Component', () => {
    it('should render 5-point star (default)', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Star
              id="star1"
              x={100}
              y={100}
              width={100}
              height={100}
              points={5}
              fill="#FFFF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should render 6-point star', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Star
              id="star2"
              x={100}
              y={100}
              width={100}
              height={100}
              points={6}
              fill="#FFFF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should render 8-point star', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Star
              id="star3"
              x={100}
              y={100}
              width={100}
              height={100}
              points={8}
              fill="#FFFF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should handle rotation', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Star
              id="star4"
              x={100}
              y={100}
              width={100}
              height={100}
              points={5}
              rotation={36}
              fill="#FFFF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })
  })

  describe('RoundedRect Component', () => {
    it('should render rounded rectangle with default corner radius', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <RoundedRect
              id="rect1"
              x={100}
              y={100}
              width={100}
              height={100}
              cornerRadius={10}
              fill="#FF00FFFF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should render rounded rectangle with large corner radius', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <RoundedRect
              id="rect2"
              x={100}
              y={100}
              width={100}
              height={100}
              cornerRadius={25}
              fill="#FF00FFFF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should render rounded rectangle with small corner radius', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <RoundedRect
              id="rect3"
              x={100}
              y={100}
              width={100}
              height={100}
              cornerRadius={5}
              fill="#FF00FFFF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should handle rotation', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <RoundedRect
              id="rect4"
              x={100}
              y={100}
              width={100}
              height={100}
              cornerRadius={10}
              rotation={45}
              fill="#FF00FFFF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })
  })

  describe('Common Shape Properties', () => {
    it('should handle selection state for all shapes', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Line
              id="line"
              points={[0, 0, 100, 100]}
              x={0}
              y={0}
              stroke="#FF0000FF"
              strokeWidth={2}
              fill="#FF0000FF"
              selected={true}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
            <Polygon
              id="polygon"
              x={200}
              y={100}
              width={100}
              height={100}
              sides={5}
              fill="#00FF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={true}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
            <Star
              id="star"
              x={350}
              y={100}
              width={100}
              height={100}
              points={5}
              fill="#FFFF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={true}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
            <RoundedRect
              id="rounded"
              x={500}
              y={100}
              width={100}
              height={100}
              cornerRadius={10}
              fill="#FF00FFFF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={true}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should handle different stroke widths', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Polygon
              id="polygon-thin"
              x={100}
              y={100}
              width={100}
              height={100}
              sides={6}
              fill="#00FF00FF"
              stroke="#000000FF"
              strokeWidth={1}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
            <Polygon
              id="polygon-thick"
              x={250}
              y={100}
              width={100}
              height={100}
              sides={6}
              fill="#00FF00FF"
              stroke="#000000FF"
              strokeWidth={5}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should handle transparency in colors', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Star
              id="star-opaque"
              x={100}
              y={100}
              width={100}
              height={100}
              points={5}
              fill="#FFFF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
            <Star
              id="star-transparent"
              x={250}
              y={100}
              width={100}
              height={100}
              points={5}
              fill="#FFFF0080"
              stroke="#00000080"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle minimum polygon sides (3)', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Polygon
              id="poly-min"
              x={100}
              y={100}
              width={100}
              height={100}
              sides={3}
              fill="#00FF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should handle minimum star points (3)', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Star
              id="star-min"
              x={100}
              y={100}
              width={100}
              height={100}
              points={3}
              fill="#FFFF00FF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should handle zero corner radius', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <RoundedRect
              id="rect-square"
              x={100}
              y={100}
              width={100}
              height={100}
              cornerRadius={0}
              fill="#FF00FFFF"
              stroke="#000000FF"
              strokeWidth={2}
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should handle vertical line', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Line
              id="line-vertical"
              points={[100, 0, 100, 200]}
              x={0}
              y={0}
              stroke="#FF0000FF"
              strokeWidth={2}
              fill="#FF0000FF"
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })

    it('should handle horizontal line', () => {
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <Line
              id="line-horizontal"
              points={[0, 100, 200, 100]}
              x={0}
              y={0}
              stroke="#FF0000FF"
              strokeWidth={2}
              fill="#FF0000FF"
              selected={false}
              onClick={mockOnClick}
              onDragStart={mockOnDragStart}
              onDragEnd={mockOnDragEnd}
              onTransformEnd={mockOnTransformEnd}
            />
          </Layer>
        </Stage>
      )

      expect(container.querySelector('canvas')).toBeTruthy()
    })
  })
})


