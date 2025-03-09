import pygame
import random
import math
from daisygame.util import fileutil


class Flower:
    def __init__(self):
        self.color = (255, 165, 0)
        self.radius = 0
        self.x = 0
        self.y = 0
        self.leaf_count = 0
        self.leaf = []
        self.init_leaf()
        self.index = 0

    def init_leaf(self):
        self.leaf = [random.randint(1, 5) for _ in range(6)]
        self.leaf_count = 6

    def set_index(self, index):
        self.index = index

    def set_pos(self, center_x, center_y, radius):
        self.x = center_x
        self.y = center_y
        self.radius = radius

    def ring(self):
        self.leaf = [self.leaf[-1]] + self.leaf[:-1]

    def is_inside(self, x, y):
        return (x - self.x) ** 2 + (y - self.y) ** 2 <= self.radius ** 2

    def remove(self, i):
        if self.leaf[i] == 0:
            return
        self.leaf[i] = 0
        self.leaf_count -= 1

    def make_leaf(self):
        if self.leaf_count > 3:
            return

        for i in range(6):
            if self.leaf[i] == 0:
                self.leaf[i] = random.randint(1, 5)
                self.leaf_count += 1
            if self.leaf_count == 5:
                return

def init_game():
    pygame.init()
    pygame.key.set_repeat(0)
    canvas = pygame.display.set_mode((800, 600))
    fps_clock = pygame.time.Clock()
    flowers = init_flower(400, 300, 50)
    return canvas, fps_clock, flowers

def init_flower(center_x, center_y, radius):
    flowers = []
    for i in range(7):
        flowers.append(Flower())
        flowers[i].set_index(i)

    flowers[0].set_pos(center_x, center_y, radius)

    for i in range(6):
        angle = 60 * i  # Each circle is spaced 60 degrees apart
        radians = math.radians(angle)
        x = center_x + int((radius * 3.5) * math.cos(radians))
        y = center_y + int((radius * 3.5) * math.sin(radians))
        flowers[i+1].set_pos(x, y, radius)

    return flowers


def draw_flowers(canvas, flowers):
    canvas.fill((0, 0, 0))

    for i in range(7):
        draw_flower(canvas, flowers[i])


def draw_flower(canvas, flower):
    pygame.draw.circle(canvas, flower.color, (flower.x, flower.y), flower.radius)
    small_circle_radius = 15

    COLOR_TABLE = [
        (0, 0, 0), # 0 검정
        (255, 255, 255),  # 1 흰색
        (255, 182, 193),  # 2 분홍
        (150, 123, 220),  # 3 보라
        (135, 206, 235),  # 4 하늘
        (255, 255, 0), # 5 노랑
        (255, 165, 0)  # 6 주황
    ]

    for i in range(6):
        angle = 60 * i  # Each circle is spaced 60 degrees apart
        radians = math.radians(angle)
        x = flower.x + int((flower.radius + small_circle_radius) * math.cos(radians))
        y = flower.y + int((flower.radius + small_circle_radius) * math.sin(radians))
        pygame.draw.circle(canvas, COLOR_TABLE[flower.leaf[i]], (x, y), small_circle_radius)


def main():
    high_score = fileutil.load_json_file("./crazydaisy.cfg", 0)
    canvas, fps_clock, flowers = init_game()

    leafs = [
        [0, 13], [1, 24], [2, 35], [3,40], [4, 51], [5, 62],
        [12, 25], [14, 61],
        [23, 30],
        [34, 41],
        [45, 52],
        [50, 63]
    ]
    score = 0

    version = 'CrazyDaisy ver V0.1'
    pygame.display.set_caption(version)
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE or event.key == pygame.K_j:
                    ...
                elif event.key == pygame.K_p:
                    ...
                elif event.key == pygame.K_s:
                    ...
            if event.type == pygame.MOUSEBUTTONDOWN:
                x = event.pos[0]
                y = event.pos[1]
                for i in range(7):
                    if flowers[i].is_inside(x, y):
                        print(f'flower {i} is changed to {flowers[i].leaf}')
                        #print(f'flower 1 is changed to {flowers[1].leaf} / score {score}')
                        flowers[i].ring()
                        for leaf in leafs:
                            left_flower = leaf[0] // 10
                            left_flower_leaf = leaf[0] % 10
                            right_flower = leaf[1] // 10
                            right_flower_leaf = leaf[1] % 10

                            if (flowers[left_flower].leaf[left_flower_leaf] > 0
                                    and flowers[left_flower].leaf[left_flower_leaf] == flowers[right_flower].leaf[right_flower_leaf]):
                                flowers[left_flower].remove(left_flower_leaf)
                                flowers[right_flower].remove(right_flower_leaf)
                                score += 1
                    else:
                        flowers[i].make_leaf()

        draw_flowers(canvas, flowers)
        pygame.display.update()
        fps_clock.tick(30)


if __name__ == '__main__':
    main()